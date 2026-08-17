import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await db.user.findUnique({ where: { id: session.userId } });
    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const rental = await db.rental.findUnique({
      where: { id },
      include: {
        product: { select: { id: true, title: true } },
        customer: { select: { id: true, name: true } },
        owner: { select: { id: true, name: true } },
        payments: true,
      },
    });

    if (!rental) {
      return NextResponse.json({ error: 'Rental not found' }, { status: 404 });
    }

    const body = await request.json();
    const { action, status: newStatus, refundAmount, notes } = body;

    const updateData: Record<string, unknown> = {};
    let auditAction = '';

    // Admin status change
    if (newStatus) {
      updateData.status = newStatus;
      auditAction = `ADMIN_CHANGE_STATUS_TO_${newStatus}`;
    }

    // Process refund
    if (action === 'refund' && refundAmount) {
      await db.refund.create({
        data: {
          rentalId: id,
          amount: refundAmount,
          reason: notes || 'Admin initiated refund',
          status: 'PENDING',
        },
      });
      auditAction = 'ADMIN_PROCESS_REFUND';
    }

    // Resolve dispute
    if (action === 'resolve_dispute') {
      await db.dispute.updateMany({
        where: { rentalId: id, status: { in: ['OPEN', 'UNDER_REVIEW'] } },
        data: { status: 'RESOLVED', resolution: notes || 'Resolved by admin', adminNotes: body.adminNotes },
      });
      auditAction = 'ADMIN_RESOLVE_DISPUTE';
    }

    const updated = await db.rental.update({
      where: { id },
      data: updateData,
      include: {
        product: { include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 }, category: { select: { name: true } } } },
        customer: { select: { id: true, name: true, avatarUrl: true } },
        owner: { select: { id: true, name: true, avatarUrl: true } },
        payments: { orderBy: { createdAt: 'desc' } },
      },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        userId: session.userId,
        action: auditAction || 'ADMIN_UPDATE_RENTAL',
        entity: 'Rental',
        entityId: id,
        details: `Admin ${currentUser.name} updated rental #${id.substring(0, 8)}. ${notes ? `Notes: ${notes}` : ''}`,
      },
    });

    // Notify affected users
    if (newStatus) {
      await db.notification.create({
        data: {
          userId: rental.customerId,
          title: 'Rental Status Updated',
          message: `Admin updated your rental #${id.substring(0, 8)} status to ${newStatus}.`,
          type: 'RENTAL_REQUEST',
        },
      });
      await db.notification.create({
        data: {
          userId: rental.ownerId,
          title: 'Rental Status Updated',
          message: `Admin updated rental #${id.substring(0, 8)} status to ${newStatus}.`,
          type: 'RENTAL_REQUEST',
        },
      });
    }

    return NextResponse.json({ rental: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

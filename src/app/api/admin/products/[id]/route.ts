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
    const product = await db.product.findUnique({
      where: { id },
      include: { owner: { select: { id: true, name: true } } },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const body = await request.json();
    const { action, reason } = body;

    const updateData: Record<string, unknown> = {};
    let auditAction = '';

    switch (action) {
      case 'approve':
        updateData.status = 'APPROVED';
        auditAction = 'APPROVE_PRODUCT';
        break;
      case 'reject':
        updateData.status = 'REJECTED';
        auditAction = 'REJECT_PRODUCT';
        break;
      case 'suspend':
        updateData.status = 'SUSPENDED';
        auditAction = 'SUSPEND_PRODUCT';
        break;
      case 'restore':
        updateData.status = 'APPROVED';
        auditAction = 'RESTORE_PRODUCT';
        break;
      default:
        return NextResponse.json({ error: 'Invalid action. Use: approve, reject, suspend, restore' }, { status: 400 });
    }

    const updated = await db.product.update({
      where: { id },
      data: updateData,
      include: {
        owner: { select: { id: true, name: true, email: true, avatarUrl: true } },
        category: { select: { id: true, name: true } },
        images: { orderBy: { sortOrder: 'asc' } },
      },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        userId: session.userId,
        action: auditAction,
        entity: 'Product',
        entityId: id,
        details: `Admin ${currentUser.name} performed ${action} on product "${product.title}" by ${product.owner.name}`,
      },
    });

    // Notify product owner
    await db.notification.create({
      data: {
        userId: product.ownerId,
        title: `Product ${action === 'approve' ? 'Approved' : action === 'reject' ? 'Rejected' : action === 'suspend' ? 'Suspended' : 'Restored'}`,
        message: `Your product "${product.title}" has been ${action}d by admin.${reason ? ` Reason: ${reason}` : ''}`,
        type: 'RENTAL_REQUEST',
      },
    });

    return NextResponse.json({ product: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

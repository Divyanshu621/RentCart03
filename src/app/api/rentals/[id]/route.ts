import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const rental = await db.rental.findUnique({
      where: { id },
      include: {
        product: { include: { images: { orderBy: { sortOrder: 'asc' } }, category: true, owner: { select: { id: true, name: true, avatarUrl: true } } } },
        customer: { select: { id: true, name: true, email: true, phone: true, avatarUrl: true, address: true, pinCode: true, city: true, state: true } },
        owner: { select: { id: true, name: true, email: true, phone: true, avatarUrl: true, address: true, pinCode: true, city: true, state: true } },
        payments: { orderBy: { createdAt: 'desc' } },
        refunds: { orderBy: { createdAt: 'desc' } },
        extensionRequests: { orderBy: { createdAt: 'desc' } },
        reviews: true,
        disputes: true,
      },
    });

    if (!rental) {
      return NextResponse.json({ error: 'Rental not found' }, { status: 404 });
    }

    const user = await db.user.findUnique({ where: { id: session.userId } });
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

    if (rental.customerId !== session.userId && rental.ownerId !== session.userId && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(rental);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const rental = await db.rental.findUnique({ where: { id } });

    if (!rental) {
      return NextResponse.json({ error: 'Rental not found' }, { status: 404 });
    }

    const user = await db.user.findUnique({ where: { id: session.userId } });
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
    const isOwner = rental.ownerId === session.userId;

    const body = await request.json();
    const { status } = body;

    if (status) {
      // Owner-only status transitions
      const ownerStatuses = ['OWNER_ACCEPTED', 'OWNER_REJECTED', 'READY_FOR_PICKUP'];
      if (ownerStatuses.includes(status) && !isOwner && !isAdmin) {
        return NextResponse.json({ error: 'Only the owner can perform this action' }, { status: 403 });
      }

      // Admin-only status transitions
      const adminStatuses = ['ACTIVE', 'COMPLETED', 'CANCELLED', 'SUSPENDED'];
      if (adminStatuses.includes(status) && !isAdmin) {
        return NextResponse.json({ error: 'Only admin can perform this action' }, { status: 403 });
      }

      const updateData: Record<string, unknown> = { status };

      // When owner accepts, also increment product totalRentals
      if (status === 'OWNER_ACCEPTED') {
        await db.product.update({
          where: { id: rental.productId },
          data: { totalRentals: { increment: 1 } },
        });
      }

      // When owner rejects, store reason
      if (body.cancellationReason) {
        updateData.cancellationReason = body.cancellationReason;
      }

      const updated = await db.rental.update({
        where: { id },
        data: updateData,
      });

      return NextResponse.json(updated);
    }

    // If no status change, return bad request
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

const disputeSchema = z.object({
  rentalId: z.string().min(1, 'Rental ID is required'),
  reason: z.string().min(1, 'Reason is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.user.findUnique({ where: { id: session.userId } });
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

    const where: Record<string, unknown> = isAdmin ? {} : { raisedById: session.userId };

    const disputes = await db.dispute.findMany({
      where,
      include: {
        rental: {
          include: {
            product: { select: { id: true, title: true, images: { orderBy: { sortOrder: 'asc' }, take: 1 } } },
            customer: { select: { id: true, name: true, avatarUrl: true } },
            owner: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
        raisedBy: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(disputes);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = disputeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { rentalId, reason, description } = parsed.data;

    const rental = await db.rental.findUnique({ where: { id: rentalId } });
    if (!rental) {
      return NextResponse.json({ error: 'Rental not found' }, { status: 404 });
    }

    // Must be involved in the rental
    if (rental.customerId !== session.userId && rental.ownerId !== session.userId) {
      return NextResponse.json({ error: 'You are not part of this rental' }, { status: 403 });
    }

    const againstId = rental.customerId === session.userId ? rental.ownerId : rental.customerId;

    const dispute = await db.dispute.create({
      data: {
        rentalId,
        raisedById: session.userId,
        againstId,
        reason,
        description,
        status: 'OPEN',
      },
    });

    // Notify admins
    const admins = await db.user.findMany({
      where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } },
      select: { id: true },
    });

    for (const admin of admins) {
      await db.notification.create({
        data: {
          userId: admin.id,
          title: 'New Dispute Raised',
          message: `A new dispute has been raised for rental #${rentalId.substring(0, 8)}. Reason: ${reason}`,
          type: 'DISPUTE',
        },
      });
    }

    return NextResponse.json({ dispute }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(
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
      include: { payments: true },
    });

    if (!rental) {
      return NextResponse.json({ error: 'Rental not found' }, { status: 404 });
    }

    if (rental.customerId !== session.userId) {
      return NextResponse.json({ error: 'Only the customer can pay' }, { status: 403 });
    }

    if (rental.status !== 'PENDING_PAYMENT') {
      return NextResponse.json({ error: `Cannot pay rental with status: ${rental.status}` }, { status: 400 });
    }

    // Simulate payment completion
    const payment = await db.payment.updateMany({
      where: { rentalId: id, type: 'RENTAL', status: 'PENDING' },
      data: {
        status: 'COMPLETED',
        transactionId: `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      },
    });

    // If there's a security deposit, create separate payment
    if (rental.securityDeposit > 0) {
      await db.payment.create({
        data: {
          rentalId: id,
          amount: rental.securityDeposit,
          type: 'DEPOSIT',
          status: 'COMPLETED',
          transactionId: `DEP-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        },
      });
    }

    const updatedRental = await db.rental.update({
      where: { id },
      data: { status: 'OWNER_PENDING' },
    });

    // Create notification for owner
    await db.notification.create({
      data: {
        userId: rental.ownerId,
        title: 'New Rental Request',
        message: `Payment received for rental #${id.substring(0, 8)}. Please review and accept.`,
        type: 'RENTAL_REQUEST',
      },
    });

    return NextResponse.json({ rental: updatedRental, message: 'Payment successful' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

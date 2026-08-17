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
      return NextResponse.json({ error: 'Only the customer can cancel' }, { status: 403 });
    }

    if (!['PENDING_PAYMENT', 'OWNER_PENDING'].includes(rental.status)) {
      return NextResponse.json({ error: `Cannot cancel rental with status: ${rental.status}` }, { status: 400 });
    }

    const body = await request.json();
    const reason = body.reason || 'Customer cancelled';

    const updatedRental = await db.rental.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancellationReason: reason,
      },
    });

    // Create refund if payment was made
    const completedPayments = rental.payments.filter(
      (p) => p.status === 'COMPLETED'
    );
    const totalPaid = completedPayments.reduce((sum, p) => sum + p.amount, 0);

    if (totalPaid > 0) {
      await db.refund.create({
        data: {
          rentalId: id,
          amount: totalPaid,
          reason: 'Rental cancelled',
          status: 'PENDING',
        },
      });

      // Mark payments as refunded
      for (const payment of completedPayments) {
        await db.payment.update({
          where: { id: payment.id },
          data: { status: 'REFUNDED' },
        });
      }
    }

    // Notify owner
    await db.notification.create({
      data: {
        userId: rental.ownerId,
        title: 'Rental Cancelled',
        message: `Rental #${id.substring(0, 8)} has been cancelled by the customer.`,
        type: 'RETURN',
      },
    });

    return NextResponse.json({ rental: updatedRental });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

// Statuses from which a customer can cancel (with full refund)
const FULL_REFUND_STATUSES = ['PENDING_PAYMENT', 'OWNER_PENDING'];

// Statuses from which a customer can cancel (with possible partial refund)
const PARTIAL_REFUND_STATUSES = ['PAYMENT_COMPLETED', 'OWNER_ACCEPTED', 'READY_FOR_PICKUP'];

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
      include: { payments: true, product: true },
    });

    if (!rental) {
      return NextResponse.json({ error: 'Rental not found' }, { status: 404 });
    }

    // Only the customer can cancel
    if (rental.customerId !== session.userId) {
      return NextResponse.json({ error: 'Only the customer can cancel this rental' }, { status: 403 });
    }

    const allCancellable = [...FULL_REFUND_STATUSES, ...PARTIAL_REFUND_STATUSES];
    if (!allCancellable.includes(rental.status)) {
      return NextResponse.json(
        { error: `Cannot cancel rental with status: ${rental.status}. Cancellation is only available before the rental becomes active.` },
        { status: 400 }
      );
    }

    const body = await request.json();
    const reason = body.reason || 'Customer cancelled';

    // Calculate refund based on cancellation timing
    const isFullRefund = FULL_REFUND_STATUSES.includes(rental.status);
    const completedPayments = rental.payments.filter((p) => p.status === 'COMPLETED');
    const totalPaid = completedPayments.reduce((sum, p) => sum + p.amount, 0);

    let refundAmount = 0;
    if (totalPaid > 0) {
      if (isFullRefund) {
        // Full refund for early cancellations
        refundAmount = totalPaid;
      } else {
        // Partial refund: 90% of rental amount (10% cancellation fee), full refund of security deposit
        const rentalPayments = completedPayments.filter((p) => p.type === 'RENTAL');
        const depositPayments = completedPayments.filter((p) => p.type === 'DEPOSIT');
        const rentalPaid = rentalPayments.reduce((sum, p) => sum + p.amount, 0);
        const depositPaid = depositPayments.reduce((sum, p) => sum + p.amount, 0);
        // 90% of rental payment + 100% of deposit
        refundAmount = Math.round(rentalPaid * 0.9) + depositPaid;
      }
    }

    // Update rental status
    const updatedRental = await db.rental.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancellationReason: reason,
      },
    });

    // Create refund record if applicable
    if (refundAmount > 0) {
      await db.refund.create({
        data: {
          rentalId: id,
          amount: refundAmount,
          reason: isFullRefund ? 'Full refund - rental cancelled before processing' : 'Partial refund - 10% cancellation fee applied',
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

      // Re-activate product availability
      await db.product.update({
        where: { id: rental.productId },
        data: { status: 'APPROVED' },
      });
    }

    // Notify owner
    await db.notification.create({
      data: {
        userId: rental.ownerId,
        title: 'Rental Cancelled',
        message: `Rental #${id.substring(0, 8)} for "${rental.product?.title || 'Item'}" has been cancelled by the customer.${!isFullRefund ? ` A refund of ₹${refundAmount.toLocaleString('en-IN')} will be processed.` : ''}`,
        type: 'RETURN',
      },
    });

    // Notify customer about refund
    if (refundAmount > 0) {
      await db.notification.create({
        data: {
          userId: rental.customerId,
          title: 'Cancellation Confirmed',
          message: `Your rental #${id.substring(0, 8)} has been cancelled. ${isFullRefund ? 'Full' : 'Partial'} refund of ₹${refundAmount.toLocaleString('en-IN')} will be processed within 5-7 business days.`,
          type: 'RETURN',
        },
      });
    }

    return NextResponse.json({
      rental: updatedRental,
      refundAmount,
      isFullRefund,
      message: isFullRefund
        ? 'Rental cancelled. Full refund will be processed.'
        : `Rental cancelled. Refund of ₹${refundAmount.toLocaleString('en-IN')} will be processed (10% cancellation fee deducted).`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

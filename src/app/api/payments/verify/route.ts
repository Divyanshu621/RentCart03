// POST /api/payments/verify
// Verifies Razorpay payment signature and completes the rental
// In demo mode, directly completes the payment
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import crypto from 'crypto';

const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

const isRazorpayConfigured = !!(
  process.env.RAZORPAY_KEY_ID &&
  RAZORPAY_KEY_SECRET &&
  process.env.RAZORPAY_KEY_SECRET!.length > 10
);

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { rentalId, razorpayOrderId, razorpayPaymentId, razorpaySignature, paymentMethod } = body;

    if (!rentalId) return NextResponse.json({ error: 'Rental ID required' }, { status: 400 });

    // Verify Razorpay signature if real mode
    if (isRazorpayConfigured && razorpayOrderId && razorpayPaymentId && razorpaySignature) {
      const expectedSignature = crypto
        .createHmac('sha256', RAZORPAY_KEY_SECRET!)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');

      if (expectedSignature !== razorpaySignature) {
        return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 });
      }
    }

    // Complete the rental payment
    const rental = await db.rental.findUnique({ where: { id: rentalId } });
    if (!rental) return NextResponse.json({ error: 'Rental not found' }, { status: 404 });
    if (rental.customerId !== session.userId) return NextResponse.json({ error: 'Not your rental' }, { status: 403 });
    if (rental.status !== 'PENDING_PAYMENT') return NextResponse.json({ error: 'Invalid rental status' }, { status: 400 });

    // Mark rental payment as completed
    const txnId = razorpayPaymentId || `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    await db.payment.updateMany({
      where: { rentalId, type: 'RENTAL', status: 'PENDING' },
      data: {
        status: 'COMPLETED',
        transactionId: txnId,
        paymentMethod: paymentMethod || (isRazorpayConfigured ? 'RAZORPAY' : 'SIMULATED'),
      },
    });

    // Security deposit
    if (rental.securityDeposit > 0) {
      await db.payment.create({
        data: {
          rentalId,
          amount: rental.securityDeposit,
          type: 'DEPOSIT',
          status: 'COMPLETED',
          transactionId: `DEP-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
          paymentMethod: paymentMethod || (isRazorpayConfigured ? 'RAZORPAY' : 'SIMULATED'),
        },
      });
    }

    // Update rental status
    const updatedRental = await db.rental.update({
      where: { id: rentalId },
      data: { status: 'OWNER_PENDING' },
      include: {
        product: { select: { title: true } },
        owner: { select: { id: true, name: true } },
      },
    });

    // Notify owner
    await db.notification.create({
      data: {
        userId: rental.ownerId,
        title: 'New Rental Request',
        message: `Payment received for "${rental.product?.title || 'Item'}". Please review and accept.`,
        type: 'RENTAL_REQUEST',
      },
    });

    return NextResponse.json({
      rental: updatedRental,
      message: 'Payment successful!',
      transactionId: txnId,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

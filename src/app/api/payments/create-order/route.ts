// POST /api/payments/create-order
// Creates a Razorpay order for a rental payment
// Falls back to simulated mode if RAZORPAY_KEY_ID is not configured
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

const isRazorpayConfigured = !!(RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET && RAZORPAY_KEY_ID.length > 10);

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { rentalId, paymentMethod } = await request.json();
    if (!rentalId) return NextResponse.json({ error: 'Rental ID is required' }, { status: 400 });

    // Check payment method is enabled in settings
    const paySettings = await db.paymentSettings.findUnique({ where: { id: 'default' } });
    const methodMap: Record<string, string> = {
      RAZORPAY: 'razorpay',
      UPI: 'upi',
      CARD: 'card',
      NETBANKING: 'netbanking',
      WALLET: 'wallet',
      CASH_ON_PICKUP: 'cash',
    };
    const methodKey = paymentMethod ? methodMap[paymentMethod] : 'razorpay';
    if (paySettings && methodKey) {
      const isEnabled = paySettings[`${methodKey}Enabled` as keyof typeof paySettings] as boolean | undefined;
      if (isEnabled === false) {
        return NextResponse.json({ error: 'This payment method is currently disabled' }, { status: 400 });
      }
    }

    const rental = await db.rental.findUnique({
      where: { id: rentalId },
      include: {
        product: { select: { title: true } },
        customer: { select: { name: true, email: true, phone: true } },
      },
    });

    if (!rental) return NextResponse.json({ error: 'Rental not found' }, { status: 404 });
    if (rental.customerId !== session.userId) return NextResponse.json({ error: 'Not your rental' }, { status: 403 });
    if (rental.status !== 'PENDING_PAYMENT') return NextResponse.json({ error: 'Rental is not awaiting payment' }, { status: 400 });

    const amountInPaise = Math.round(rental.totalAmount * 100);

    // Real Razorpay integration
    if (isRazorpayConfigured) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const Razorpay = require('razorpay');
      const razorpay = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });

      const order = await razorpay.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `rcpt_${rentalId.substring(0, 12)}`,
        notes: {
          rentalId,
          customerId: session.userId,
          productName: rental.product?.title || 'Rental',
        },
      });

      // Update payment method
      await db.payment.updateMany({
        where: { rentalId, type: 'RENTAL', status: 'PENDING' },
        data: { paymentMethod: paymentMethod || 'RAZORPAY' },
      });

      return NextResponse.json({
        orderId: order.id,
        amount: rental.totalAmount,
        currency: 'INR',
        key: RAZORPAY_KEY_ID,
        customer: {
          name: rental.customer?.name || '',
          email: rental.customer?.email || '',
          contact: rental.customer?.phone || '',
        },
        method: 'razorpay',
      });
    }

    // Demo/simulated mode
    await db.payment.updateMany({
      where: { rentalId, type: 'RENTAL', status: 'PENDING' },
      data: { paymentMethod: paymentMethod || 'SIMULATED' },
    });

    return NextResponse.json({
      orderId: `order_demo_${Date.now()}`,
      amount: rental.totalAmount,
      currency: 'INR',
      key: null,
      customer: {
        name: rental.customer?.name || '',
        email: rental.customer?.email || '',
        contact: rental.customer?.phone || '',
      },
      method: 'simulated',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

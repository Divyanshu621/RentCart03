import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

const validateSchema = z.object({
  code: z.string().min(1, 'Coupon code is required'),
  userId: z.string().optional(),
  orderAmount: z.number().min(0).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request);
    const body = await request.json();
    const parsed = validateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { code, userId, orderAmount } = parsed.data;
    const couponCode = code.toUpperCase();

    const coupon = await db.coupon.findUnique({ where: { code: couponCode } });

    if (!coupon) {
      return NextResponse.json({ valid: false, error: 'Coupon not found' });
    }

    if (!coupon.isActive) {
      return NextResponse.json({ valid: false, error: 'Coupon is inactive' });
    }

    const now = new Date();
    if (coupon.validFrom > now) {
      return NextResponse.json({ valid: false, error: 'Coupon is not yet valid' });
    }
    if (coupon.validUntil && coupon.validUntil < now) {
      return NextResponse.json({ valid: false, error: 'Coupon has expired' });
    }

    if (coupon.usageLimit && coupon.timesUsed >= coupon.usageLimit) {
      return NextResponse.json({ valid: false, error: 'Coupon usage limit reached' });
    }

    // Check per-user limit
    const effectiveUserId = session?.userId || userId;
    if (effectiveUserId) {
      const userUsages = await db.couponUsage.count({
        where: { couponId: coupon.id, userId: effectiveUserId },
      });
      if (userUsages >= coupon.perUserLimit) {
        return NextResponse.json({ valid: false, error: 'You have already used this coupon' });
      }
    }

    // Calculate discount
    let discountAmount = 0;
    if (orderAmount !== undefined) {
      if (orderAmount < coupon.minOrder) {
        return NextResponse.json({ valid: false, error: `Minimum order amount is ₹${coupon.minOrder}` });
      }

      if (coupon.type === 'PERCENTAGE') {
        discountAmount = orderAmount * (coupon.value / 100);
        if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
          discountAmount = coupon.maxDiscount;
        }
      } else {
        discountAmount = coupon.value;
      }
    }

    return NextResponse.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        maxDiscount: coupon.maxDiscount,
        minOrder: coupon.minOrder,
      },
      discountAmount,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

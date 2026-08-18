import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

const createRentalSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  couponCode: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const role = searchParams.get('role') || 'customer';

    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }

    if (role === 'owner') {
      where.ownerId = session.userId;
    } else {
      where.customerId = session.userId;
    }

    const rentals = await db.rental.findMany({
      where,
      include: {
        product: { include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 }, category: { select: { name: true } } } },
        customer: { select: { id: true, name: true, avatarUrl: true } },
        owner: { select: { id: true, name: true, avatarUrl: true } },
        payments: { orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(rentals);
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
    const parsed = createRentalSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { productId, startDate: startDateStr, endDate: endDateStr, couponCode } = parsed.data;

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
    }

    if (endDate <= startDate) {
      return NextResponse.json({ error: 'End date must be after start date' }, { status: 400 });
    }

    // Fetch product from DB - never trust frontend price
    const product = await db.product.findUnique({
      where: { id: productId },
      include: { owner: true },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (product.status !== 'APPROVED') {
      return NextResponse.json({ error: 'Product is not available for rental' }, { status: 400 });
    }

    // Note: Cross-state rentals are allowed (delivery available for many items)

    // Can't rent own product
    if (product.ownerId === session.userId) {
      console.error('[RENTAL 400] Own product:', { ownerId: product.ownerId, userId: session.userId });
      return NextResponse.json({ error: 'Cannot rent your own product' }, { status: 400 });
    }

    const rentalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    if (rentalDays < product.minRentalDays) {
      console.error('[RENTAL 400] Min days:', { rentalDays, minDays: product.minRentalDays });
      return NextResponse.json({ error: `Minimum rental period is ${product.minRentalDays} days` }, { status: 400 });
    }

    if (rentalDays > product.maxRentalDays) {
      console.error('[RENTAL 400] Max days:', { rentalDays, maxDays: product.maxRentalDays });
      return NextResponse.json({ error: `Maximum rental period is ${product.maxRentalDays} days` }, { status: 400 });
    }

    // Check availability
    const overlappingRentals = await db.rental.findMany({
      where: {
        productId,
        status: { in: ['OWNER_ACCEPTED', 'ACTIVE', 'RETURN_PENDING'] },
        OR: [
          { startDate: { lte: endDate }, endDate: { gte: startDate } },
        ],
      },
    });

    if (overlappingRentals.length > 0) {
      console.error('[RENTAL 400] Availability:', { productId, overlappingCount: overlappingRentals.length });
      return NextResponse.json({ error: 'Product is not available for the selected dates' }, { status: 400 });
    }

    // Calculate pricing from DB product
    const dailyRate = product.dailyPrice;
    const rentalAmount = dailyRate * rentalDays;
    const platformFee = rentalAmount * 0.10;
    const deliveryFee = product.deliveryAvailable ? product.deliveryFee : 0;
    let discount = 0;

    // Validate coupon if provided
    let couponUsed = null;
    if (couponCode) {
      const coupon = await db.coupon.findUnique({ where: { code: couponCode.toUpperCase() } });
      if (!coupon || !coupon.isActive) {
        return NextResponse.json({ error: 'Invalid or inactive coupon' }, { status: 400 });
      }

      const now = new Date();
      if (coupon.validUntil && coupon.validUntil < now) {
        return NextResponse.json({ error: 'Coupon has expired' }, { status: 400 });
      }
      if (coupon.validFrom > now) {
        return NextResponse.json({ error: 'Coupon is not yet valid' }, { status: 400 });
      }
      if (coupon.usageLimit && coupon.timesUsed >= coupon.usageLimit) {
        return NextResponse.json({ error: 'Coupon usage limit reached' }, { status: 400 });
      }

      // Check per-user limit
      const userUsages = await db.couponUsage.count({
        where: { couponId: coupon.id, userId: session.userId },
      });
      if (userUsages >= coupon.perUserLimit) {
        return NextResponse.json({ error: 'You have already used this coupon' }, { status: 400 });
      }

      // Check min order
      if (rentalAmount < coupon.minOrder) {
        return NextResponse.json({ error: `Minimum order amount for this coupon is ₹${coupon.minOrder}` }, { status: 400 });
      }

      if (coupon.type === 'PERCENTAGE') {
        discount = rentalAmount * (coupon.value / 100);
        if (coupon.maxDiscount && discount > coupon.maxDiscount) {
          discount = coupon.maxDiscount;
        }
      } else {
        discount = coupon.value;
      }

      couponUsed = coupon;
    }

    const tax = rentalAmount * 0.18;
    const totalAmount = rentalAmount + platformFee + deliveryFee + tax - discount;

    // Create rental
    const rental = await db.rental.create({
      data: {
        customerId: session.userId,
        ownerId: product.ownerId,
        productId,
        startDate,
        endDate,
        rentalDays,
        dailyRate,
        rentalAmount,
        securityDeposit: product.securityDeposit,
        platformFee,
        deliveryFee,
        tax,
        discount,
        totalAmount,
        status: 'PENDING_PAYMENT',
      },
      include: {
        product: { include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 }, category: { select: { name: true } } } },
        customer: { select: { id: true, name: true, avatarUrl: true } },
        owner: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    // Create initial payment record
    await db.payment.create({
      data: {
        rentalId: rental.id,
        amount: totalAmount,
        type: 'RENTAL',
        status: 'PENDING',
      },
    });

    // Record coupon usage
    if (couponUsed) {
      await db.couponUsage.create({
        data: {
          couponId: couponUsed.id,
          userId: session.userId,
          rentalId: rental.id,
        },
      });
      await db.coupon.update({
        where: { id: couponUsed.id },
        data: { timesUsed: { increment: 1 } },
      });
    }

    return NextResponse.json({ rental }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

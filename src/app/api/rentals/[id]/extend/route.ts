import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

const extendSchema = z.object({
  requestedDays: z.number().int().min(1, 'Must request at least 1 day'),
  reason: z.string().optional(),
});

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
    const body = await request.json();
    const parsed = extendSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { requestedDays, reason } = parsed.data;

    const rental = await db.rental.findUnique({ where: { id } });
    if (!rental) {
      return NextResponse.json({ error: 'Rental not found' }, { status: 404 });
    }

    if (rental.customerId !== session.userId) {
      return NextResponse.json({ error: 'Only the customer can request extension' }, { status: 403 });
    }

    if (!['ACTIVE', 'RETURN_PENDING'].includes(rental.status)) {
      return NextResponse.json({ error: `Cannot extend rental with status: ${rental.status}` }, { status: 400 });
    }

    const currentEnd = new Date(rental.endDate);
    const newEndDate = new Date(currentEnd);
    newEndDate.setDate(newEndDate.getDate() + requestedDays);

    // Check availability for the extended period
    const overlappingRentals = await db.rental.findMany({
      where: {
        productId: rental.productId,
        id: { not: id },
        status: { in: ['OWNER_ACCEPTED', 'ACTIVE', 'RETURN_PENDING'] },
        OR: [
          { startDate: { lte: newEndDate }, endDate: { gte: currentEnd } },
        ],
      },
    });

    if (overlappingRentals.length > 0) {
      return NextResponse.json({ error: 'Product is not available for the extended dates' }, { status: 400 });
    }

    const additionalFee = rental.dailyRate * requestedDays;

    const extension = await db.extensionRequest.create({
      data: {
        rentalId: id,
        requestedDays,
        newEndDate,
        additionalFee,
        reason,
        status: 'PENDING',
      },
    });

    // Notify owner
    await db.notification.create({
      data: {
        userId: rental.ownerId,
        title: 'Extension Requested',
        message: `Customer requested ${requestedDays} day(s) extension for rental #${id.substring(0, 8)}. Additional fee: ₹${additionalFee.toFixed(2)}`,
        type: 'RETURN',
      },
    });

    return NextResponse.json({ extension }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

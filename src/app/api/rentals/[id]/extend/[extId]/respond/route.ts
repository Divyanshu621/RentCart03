import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

const respondSchema = z.object({
  action: z.enum(['APPROVED', 'REJECTED']),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; extId: string }> }
) {
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, extId } = await params;
    const body = await request.json();
    const parsed = respondSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { action } = parsed.data;

    const rental = await db.rental.findUnique({ where: { id } });
    if (!rental) {
      return NextResponse.json({ error: 'Rental not found' }, { status: 404 });
    }

    if (rental.ownerId !== session.userId) {
      return NextResponse.json({ error: 'Only the owner can respond to extension requests' }, { status: 403 });
    }

    const extension = await db.extensionRequest.findUnique({ where: { id: extId } });
    if (!extension || extension.rentalId !== id) {
      return NextResponse.json({ error: 'Extension request not found' }, { status: 404 });
    }

    if (extension.status !== 'PENDING') {
      return NextResponse.json({ error: 'Extension request already processed' }, { status: 400 });
    }

    const updatedExtension = await db.extensionRequest.update({
      where: { id: extId },
      data: { status: action },
    });

    if (action === 'APPROVED') {
      // Update rental end date
      const updatedRental = await db.rental.update({
        where: { id },
        data: { endDate: extension.newEndDate },
      });

      // Create additional payment
      await db.payment.create({
        data: {
          rentalId: id,
          amount: extension.additionalFee,
          type: 'EXTENSION',
          status: 'PENDING',
        },
      });

      // Notify customer
      await db.notification.create({
        data: {
          userId: rental.customerId,
          title: 'Extension Approved',
          message: `Owner approved your ${extension.requestedDays} day extension for rental #${id.substring(0, 8)}. Please pay the additional fee of ₹${extension.additionalFee.toFixed(2)}.`,
          type: 'PAYMENT',
        },
      });

      return NextResponse.json({ extension: updatedExtension, rental: updatedRental });
    }

    // Notify customer of rejection
    await db.notification.create({
      data: {
        userId: rental.customerId,
        title: 'Extension Rejected',
        message: `Owner rejected your extension request for rental #${id.substring(0, 8)}.`,
        type: 'RETURN',
      },
    });

    return NextResponse.json({ extension: updatedExtension });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

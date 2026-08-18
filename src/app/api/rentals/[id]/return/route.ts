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

    const isCustomer = rental.customerId === session.userId;
    const isOwner = rental.ownerId === session.userId;

    if (!isCustomer && !isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));

    if (isCustomer) {
      // Customer initiates return
      if (!['ACTIVE'].includes(rental.status)) {
        return NextResponse.json({ error: `Cannot return rental with status: ${rental.status}` }, { status: 400 });
      }

      const updatedRental = await db.rental.update({
        where: { id },
        data: { status: 'RETURN_PENDING' },
      });

      // Notify owner
      await db.notification.create({
        data: {
          userId: rental.ownerId,
          title: 'Return Requested',
          message: `Customer has requested to return the product for rental #${id.substring(0, 8)}.`,
          type: 'RETURN',
        },
      });

      return NextResponse.json({ rental: updatedRental });
    }

    // Owner processes return
    if (!['RETURN_PENDING'].includes(rental.status)) {
      return NextResponse.json({ error: `Cannot process return with status: ${rental.status}` }, { status: 400 });
    }

    const inspectionResult = body.inspectionResult || 'GOOD';
    const inspectionNotes = body.inspectionNotes || '';

    const updatedRental = await db.rental.update({
      where: { id },
      data: {
        status: 'RETURNED',
        actualReturnDate: new Date(),
        inspectionResult,
        inspectionNotes,
      },
    });

    // Move to INSPECTION
    const inspectedRental = await db.rental.update({
      where: { id },
      data: { status: 'INSPECTION' },
    });

    // If inspection is GOOD, create refund for security deposit
    if (inspectionResult === 'GOOD') {
      const depositPayments = rental.payments.filter(
        (p) => p.type === 'DEPOSIT' && p.status === 'COMPLETED'
      );
      const depositAmount = depositPayments.reduce((sum, p) => sum + p.amount, 0);

      if (depositAmount > 0) {
        await db.refund.create({
          data: {
            rentalId: id,
            amount: depositAmount,
            reason: 'Security deposit refund - good condition',
            status: 'PENDING',
          },
        });
      }
    }

    // Notify customer
    await db.notification.create({
      data: {
        userId: rental.customerId,
        title: 'Return Processed',
        message: `Owner has processed your return for rental #${id.substring(0, 8)}. Inspection result: ${inspectionResult}.`,
        type: 'RETURN',
      },
    });

    return NextResponse.json({ rental: inspectedRental });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

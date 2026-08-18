import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;

    const product = await db.product.findUnique({ where: { id: productId } });
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Calculate the 90-day window
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + 90);

    // Find all active rentals that overlap with the next 90 days
    const activeRentals = await db.rental.findMany({
      where: {
        productId,
        status: { in: ['OWNER_ACCEPTED', 'ACTIVE', 'RETURN_PENDING'] },
        OR: [
          { startDate: { lte: futureDate }, endDate: { gte: today } },
        ],
      },
    });

    const unavailableDates: string[] = [];
    for (const rental of activeRentals) {
      const rentalStart = new Date(rental.startDate);
      rentalStart.setHours(0, 0, 0, 0);
      const rentalEnd = new Date(rental.endDate);
      rentalEnd.setHours(0, 0, 0, 0);

      const start = rentalStart > today ? rentalStart : today;
      const end = rentalEnd < futureDate ? rentalEnd : futureDate;

      const current = new Date(start);
      while (current <= end) {
        const yyyy = current.getFullYear();
        const mm = String(current.getMonth() + 1).padStart(2, '0');
        const dd = String(current.getDate()).padStart(2, '0');
        unavailableDates.push(`${yyyy}-${mm}-${dd}`);
        current.setDate(current.getDate() + 1);
      }
    }

    return NextResponse.json({ unavailableDates });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

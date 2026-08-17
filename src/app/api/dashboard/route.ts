import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.userId;

    const [
      activeRentals,
      completedRentals,
      upcomingRentals,
      spendingAgg,
      earningsAgg,
      pendingRequests,
      productCount,
      favoriteCount,
      user,
    ] = await Promise.all([
      db.rental.count({ where: { customerId: userId, status: 'ACTIVE' } }),
      db.rental.count({ where: { customerId: userId, status: 'COMPLETED' } }),
      db.rental.count({
        where: {
          customerId: userId,
          status: { in: ['OWNER_ACCEPTED', 'READY_FOR_PICKUP'] },
          startDate: { gt: new Date() },
        },
      }),
      db.rental.aggregate({
        where: { customerId: userId, status: { not: 'CANCELLED' } },
        _sum: { totalAmount: true },
      }),
      db.rental.aggregate({
        where: { ownerId: userId, status: { not: 'CANCELLED' } },
        _sum: { rentalAmount: true },
      }),
      db.rental.count({
        where: { ownerId: userId, status: { in: ['OWNER_PENDING', 'PENDING_PAYMENT'] } },
      }),
      db.product.count({ where: { ownerId: userId } }),
      db.favorite.count({ where: { userId } }),
      db.user.findUnique({ where: { id: userId } }),
    ]);

    return NextResponse.json({
      activeRentals,
      completedRentals,
      upcomingRentals,
      totalSpending: spendingAgg._sum.totalAmount || 0,
      totalEarnings: earningsAgg._sum.rentalAmount || 0,
      pendingRequests,
      productCount,
      favoriteCount,
      avgRatingReceived: user?.avgRating || 0,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

const reviewSchema = z.object({
  rentalId: z.string().min(1, 'Rental ID is required'),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = reviewSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { rentalId, rating, comment } = parsed.data;

    const rental = await db.rental.findUnique({
      where: { id: rentalId },
      include: { product: true },
    });

    if (!rental) {
      return NextResponse.json({ error: 'Rental not found' }, { status: 404 });
    }

    // Verify user was part of the rental
    if (rental.customerId !== session.userId && rental.ownerId !== session.userId) {
      return NextResponse.json({ error: 'You are not part of this rental' }, { status: 403 });
    }

    // Verify rental is completed
    if (rental.status !== 'COMPLETED') {
      return NextResponse.json({ error: 'Can only review completed rentals' }, { status: 400 });
    }

    // Check no existing review by this user for this rental
    const existingReview = await db.review.findFirst({
      where: { rentalId, reviewerId: session.userId },
    });

    if (existingReview) {
      return NextResponse.json({ error: 'You have already reviewed this rental' }, { status: 400 });
    }

    // Target is the other party in the rental
    const targetId = rental.customerId === session.userId ? rental.ownerId : rental.customerId;

    const review = await db.review.create({
      data: {
        rentalId,
        reviewerId: session.userId,
        targetId,
        productId: rental.productId,
        rating,
        comment,
      },
      include: {
        reviewer: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    // Update product avgRating and totalReviews
    const reviews = await db.review.findMany({
      where: { productId: rental.productId },
      select: { rating: true },
    });

    const totalReviews = reviews.length;
    const avgRating = totalReviews > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews : 0;

    await db.product.update({
      where: { id: rental.productId },
      data: { avgRating, totalReviews },
    });

    // Update target user avgRating
    const targetReviews = await db.review.findMany({
      where: { targetId },
      select: { rating: true },
    });

    const userTotalReviews = targetReviews.length;
    const userAvgRating = userTotalReviews > 0 ? targetReviews.reduce((sum, r) => sum + r.rating, 0) / userTotalReviews : 0;

    await db.user.update({
      where: { id: targetId },
      data: { avgRating: userAvgRating, totalReviews: userTotalReviews },
    });

    // Update reviewer's totalReviews
    const reviewerReviews = await db.review.count({
      where: { reviewerId: session.userId },
    });
    await db.user.update({
      where: { id: session.userId },
      data: { totalReviews: reviewerReviews },
    });

    return NextResponse.json({ review }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

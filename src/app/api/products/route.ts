import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

const createProductSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  categoryId: z.string().min(1, 'Category is required'),
  description: z.string().optional(),
  condition: z.enum(['NEW', 'LIKE_NEW', 'GOOD', 'FAIR', 'DAMAGED']),
  dailyPrice: z.number().positive('Daily price must be positive'),
  weeklyPrice: z.number().optional(),
  securityDeposit: z.number().min(0),
  minRentalDays: z.number().int().min(1),
  maxRentalDays: z.number().int().min(1),
  stateId: z.string().min(1, 'State is required'),
  cityId: z.string().min(1, 'City is required'),
  pickupAddress: z.string().optional(),
  deliveryAvailable: z.boolean(),
  deliveryFee: z.number().min(0),
  rentalRules: z.string().optional(),
  cancellationPolicy: z.string().optional(),
});

function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
  return base;
}

async function ensureUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug;
  const existing = await db.product.findUnique({ where: { slug } });
  if (!existing) return slug;

  // Append random 4 chars
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let random = '';
  for (let i = 0; i < 4; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  slug = `${baseSlug}-${random}`;
  return slug;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const categoryId = searchParams.get('categoryId');
    const stateId = searchParams.get('stateId');
    const cityId = searchParams.get('cityId');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const condition = searchParams.get('condition');
    const sort = searchParams.get('sort') || 'newest';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));

    const ownerId = searchParams.get('ownerId');
    const where: Record<string, unknown> = {};

    if (ownerId) {
      where.ownerId = ownerId;
    } else {
      where.status = 'APPROVED';
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { brand: { contains: search } },
      ];
    }
    if (categoryId) where.categoryId = categoryId;
    if (stateId) where.stateId = stateId;
    if (cityId) where.cityId = cityId;
    if (minPrice) where.dailyPrice = { ...((where.dailyPrice as Record<string, unknown>) || {}), gte: parseFloat(minPrice) };
    if (maxPrice) where.dailyPrice = { ...((where.dailyPrice as Record<string, unknown>) || {}), lte: parseFloat(maxPrice) };
    if (minPrice && maxPrice) where.dailyPrice = { gte: parseFloat(minPrice), lte: parseFloat(maxPrice) };
    if (condition) where.condition = condition;

    // Build order
    let orderBy: Record<string, string>[] | Record<string, string> = { createdAt: 'desc' };
    if (sort === 'price_asc' || sort === 'price_low') orderBy = { dailyPrice: 'asc' };
    else if (sort === 'price_desc' || sort === 'price_high') orderBy = { dailyPrice: 'desc' };
    else if (sort === 'recommended') orderBy = [{ totalRentals: 'desc' }, { createdAt: 'desc' }];
    else if (sort === 'rating') orderBy = { avgRating: 'desc' };
    else if (sort === 'most_rented') orderBy = { totalRentals: 'desc' };

    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        include: {
          owner: { select: { id: true, name: true, avatarUrl: true, isVerified: true, avgRating: true, totalReviews: true, trustScore: true } },
          category: { select: { id: true, name: true, slug: true } },
          state: { select: { id: true, name: true, code: true } },
          city: { select: { id: true, name: true, stateId: true } },
          images: { orderBy: { sortOrder: 'asc' } },
          _count: { select: { reviews: true, favorites: true } },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.product.count({ where }),
    ]);

    return NextResponse.json({
      products,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
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
    const parsed = createProductSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const data = parsed.data;
    const slug = await ensureUniqueSlug(generateSlug(data.title));

    const product = await db.product.create({
      data: {
        ownerId: session.userId,
        title: data.title,
        slug,
        categoryId: data.categoryId,
        description: data.description,
        condition: data.condition,
        dailyPrice: data.dailyPrice,
        weeklyPrice: data.weeklyPrice,
        securityDeposit: data.securityDeposit,
        minRentalDays: data.minRentalDays,
        maxRentalDays: data.maxRentalDays,
        stateId: data.stateId,
        cityId: data.cityId,
        pickupAddress: data.pickupAddress,
        deliveryAvailable: data.deliveryAvailable,
        deliveryFee: data.deliveryFee,
        rentalRules: data.rentalRules,
        cancellationPolicy: data.cancellationPolicy,
        status: 'PENDING_REVIEW',
      },
      include: {
        owner: { select: { id: true, name: true, avatarUrl: true } },
        category: true,
      },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.user.findUnique({ where: { id: session.userId } });
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));

    const where: Record<string, unknown> = {};

    if (status) where.status = status;
    if (search) {
      where.OR = [
        { id: search },
        { customer: { name: { contains: search } } },
        { owner: { name: { contains: search } } },
        { product: { title: { contains: search } } },
      ];
    }

    const [rentals, total] = await Promise.all([
      db.rental.findMany({
        where,
        include: {
          product: { select: { id: true, title: true, images: { orderBy: { sortOrder: 'asc' }, take: 1 }, category: { select: { name: true } } } },
          customer: { select: { id: true, name: true, email: true, phone: true, avatarUrl: true } },
          owner: { select: { id: true, name: true, email: true, phone: true, avatarUrl: true } },
          payments: { orderBy: { createdAt: 'desc' } },
          refunds: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.rental.count({ where }),
    ]);

    return NextResponse.json({
      rentals,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

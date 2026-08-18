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

    const { id: productId } = await params;

    const product = await db.product.findUnique({ where: { id: productId } });
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const existing = await db.favorite.findUnique({
      where: { userId_productId: { userId: session.userId, productId } },
    });

    let isFavorited: boolean;

    if (existing) {
      await db.favorite.delete({ where: { id: existing.id } });
      isFavorited = false;
    } else {
      await db.favorite.create({
        data: { userId: session.userId, productId },
      });
      isFavorited = true;
    }

    return NextResponse.json({ isFavorited });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

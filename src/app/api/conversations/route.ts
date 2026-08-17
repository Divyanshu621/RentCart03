import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

const createConvSchema = z.object({
  otherUserId: z.string().min(1, 'Other user ID is required'),
  productId: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const conversations = await db.conversation.findMany({
      where: {
        OR: [
          { user1Id: session.userId },
          { user2Id: session.userId },
        ],
      },
      include: {
        user1: { select: { id: true, name: true, avatarUrl: true } },
        user2: { select: { id: true, name: true, avatarUrl: true } },
        product: { select: { id: true, title: true, images: { orderBy: { sortOrder: 'asc' }, take: 1 } } },
      },
      orderBy: { lastMessageAt: 'desc' },
    });

    // Add other user info and unread count
    const enriched = conversations.map((conv) => {
      const isUser1 = conv.user1Id === session.userId;
      const otherUser = isUser1 ? conv.user2 : conv.user1;
      return {
        ...conv,
        otherUser,
      };
    });

    return NextResponse.json(enriched);
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
    const parsed = createConvSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { otherUserId, productId } = parsed.data;

    if (otherUserId === session.userId) {
      return NextResponse.json({ error: 'Cannot create conversation with yourself' }, { status: 400 });
    }

    const otherUser = await db.user.findUnique({ where: { id: otherUserId } });
    if (!otherUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find or create conversation - use consistent ordering for user IDs
    const [smallerId, largerId] = [session.userId, otherUserId].sort();

    let conversation = await db.conversation.findUnique({
      where: {
        user1Id_user2Id_productId: {
          user1Id: smallerId,
          user2Id: largerId,
          productId: productId || null as unknown as string,
        },
      },
      include: {
        user1: { select: { id: true, name: true, avatarUrl: true } },
        user2: { select: { id: true, name: true, avatarUrl: true } },
        product: { select: { id: true, title: true, images: { orderBy: { sortOrder: 'asc' }, take: 1 } } },
      },
    });

    if (!conversation) {
      conversation = await db.conversation.create({
        data: {
          user1Id: smallerId,
          user2Id: largerId,
          productId: productId || null,
        },
        include: {
          user1: { select: { id: true, name: true, avatarUrl: true } },
          user2: { select: { id: true, name: true, avatarUrl: true } },
          product: { select: { id: true, title: true, images: { orderBy: { sortOrder: 'asc' }, take: 1 } } },
        },
      });
    }

    return NextResponse.json({ conversation });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

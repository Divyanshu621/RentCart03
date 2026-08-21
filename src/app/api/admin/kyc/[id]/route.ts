import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';

const reviewSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT']),
  rejectionReason: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin permissions
    const adminUser = await db.user.findUnique({
      where: { id: session.userId },
      select: { role: true },
    });

    if (!adminUser || (adminUser.role !== 'ADMIN' && adminUser.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = reviewSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const { action, rejectionReason } = parsed.data;

    const kyc = await db.sellerKyc.findUnique({
      where: { id },
    });

    if (!kyc) {
      return NextResponse.json({ error: 'KYC record not found' }, { status: 404 });
    }

    if (kyc.status !== 'SUBMITTED' && kyc.status !== 'UNDER_REVIEW') {
      return NextResponse.json({ error: `Cannot review KYC with status: ${kyc.status}` }, { status: 400 });
    }

    const now = new Date();

    if (action === 'APPROVE') {
      await db.sellerKyc.update({
        where: { id },
        data: {
          status: 'VERIFIED',
          verifiedAt: now,
          reviewedBy: session.userId,
        },
      });

      await db.user.update({
        where: { id: kyc.userId },
        data: {
          kycStatus: 'VERIFIED',
          isVerified: true,
        },
      });
    } else {
      await db.sellerKyc.update({
        where: { id },
        data: {
          status: 'REJECTED',
          rejectedAt: now,
          rejectionReason: rejectionReason || 'Documents do not meet our verification standards',
          reviewedBy: session.userId,
        },
      });

      await db.user.update({
        where: { id: kyc.userId },
        data: { kycStatus: 'REJECTED' },
      });
    }

    return NextResponse.json({
      success: true,
      message: action === 'APPROVE' ? 'KYC verified successfully' : 'KYC rejected',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: { id: true, role: true, kycStatus: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Only OWNER role needs KYC
    if (user.role !== 'OWNER') {
      return NextResponse.json({ kycStatus: 'NOT_REQUIRED', kyc: null });
    }

    let kyc = await db.sellerKyc.findUnique({
      where: { userId: session.userId },
    });

    // If no KYC record exists and user is OWNER, create a draft
    if (!kyc) {
      kyc = await db.sellerKyc.create({
        data: { userId: session.userId },
      });
      // Also update user kycStatus to PENDING
      await db.user.update({
        where: { id: session.userId },
        data: { kycStatus: 'PENDING' },
      });
    }

    return NextResponse.json({ kycStatus: user.kycStatus, kyc });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

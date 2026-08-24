// GET /api/settings/payment — Public: returns which payment methods are enabled
// PUT /api/settings/payment — Admin only: update payment method toggles
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

// Public: return enabled payment methods
export async function GET() {
  try {
    let settings = await db.paymentSettings.findUnique({ where: { id: 'default' } });

    // Auto-create if missing
    if (!settings) {
      settings = await db.paymentSettings.create({
        data: { id: 'default' },
      });
    }

    return NextResponse.json({
      enabledMethods: {
        razorpay: settings.razorpayEnabled,
        upi: settings.upiEnabled,
        card: settings.cardEnabled,
        netbanking: settings.netbankingEnabled,
        wallet: settings.walletEnabled,
        cash: settings.cashOnPickupEnabled,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch payment settings';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Admin only: update payment method toggles
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Check admin role
    const user = await db.user.findUnique({ where: { id: session.userId }, select: { role: true } });
    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const {
      razorpayEnabled,
      upiEnabled,
      cardEnabled,
      netbankingEnabled,
      walletEnabled,
      cashOnPickupEnabled,
    } = body as Partial<{
      razorpayEnabled: boolean;
      upiEnabled: boolean;
      cardEnabled: boolean;
      netbankingEnabled: boolean;
      walletEnabled: boolean;
      cashOnPickupEnabled: boolean;
    }>;

    // Build update data with only provided fields
    const updateData: Record<string, boolean> = {};
    if (razorpayEnabled !== undefined) updateData.razorpayEnabled = razorpayEnabled;
    if (upiEnabled !== undefined) updateData.upiEnabled = upiEnabled;
    if (cardEnabled !== undefined) updateData.cardEnabled = cardEnabled;
    if (netbankingEnabled !== undefined) updateData.netbankingEnabled = netbankingEnabled;
    if (walletEnabled !== undefined) updateData.walletEnabled = walletEnabled;
    if (cashOnPickupEnabled !== undefined) updateData.cashOnPickupEnabled = cashOnPickupEnabled;

    // Ensure at least one method stays enabled
    let settings = await db.paymentSettings.findUnique({ where: { id: 'default' } });
    if (!settings) {
      settings = await db.paymentSettings.create({ data: { id: 'default' } });
    }

    // Check we're not disabling all methods
    const afterUpdate = { ...settings, ...updateData };
    const anyEnabled = [
      afterUpdate.razorpayEnabled,
      afterUpdate.upiEnabled,
      afterUpdate.cardEnabled,
      afterUpdate.netbankingEnabled,
      afterUpdate.walletEnabled,
      afterUpdate.cashOnPickupEnabled,
    ].some(Boolean);

    if (!anyEnabled) {
      return NextResponse.json(
        { error: 'At least one payment method must remain enabled' },
        { status: 400 }
      );
    }

    const updated = await db.paymentSettings.update({
      where: { id: 'default' },
      data: updateData,
    });

    return NextResponse.json({
      message: 'Payment settings updated',
      enabledMethods: {
        razorpay: updated.razorpayEnabled,
        upi: updated.upiEnabled,
        card: updated.cardEnabled,
        netbanking: updated.netbankingEnabled,
        wallet: updated.walletEnabled,
        cash: updated.cashOnPickupEnabled,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update payment settings';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

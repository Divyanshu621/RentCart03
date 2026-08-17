import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await db.user.findUnique({ where: { id: session.userId } });
    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const targetUser = await db.user.findUnique({ where: { id } });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { action } = body;

    const updateData: Record<string, unknown> = {};
    let auditAction = '';

    switch (action) {
      case 'verify':
        updateData.isVerified = true;
        auditAction = 'VERIFY_USER';
        break;
      case 'unverify':
        updateData.isVerified = false;
        auditAction = 'UNVERIFY_USER';
        break;
      case 'suspend':
        updateData.isActive = false;
        auditAction = 'SUSPEND_USER';
        break;
      case 'activate':
        updateData.isActive = true;
        auditAction = 'ACTIVATE_USER';
        break;
      case 'role':
        if (!body.role || !['CUSTOMER', 'OWNER', 'ADMIN'].includes(body.role)) {
          return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
        }
        updateData.role = body.role;
        auditAction = `CHANGE_ROLE_TO_${body.role}`;
        break;
      default:
        return NextResponse.json({ error: 'Invalid action. Use: verify, unverify, suspend, activate, role' }, { status: 400 });
    }

    const updated = await db.user.update({
      where: { id },
      data: updateData,
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        userId: session.userId,
        action: auditAction,
        entity: 'User',
        entityId: id,
        details: `Admin ${currentUser.name} performed ${action} on user ${targetUser.name}`,
      },
    });

    const { passwordHash: _, ...userWithoutPassword } = updated;

    return NextResponse.json({ user: userWithoutPassword });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

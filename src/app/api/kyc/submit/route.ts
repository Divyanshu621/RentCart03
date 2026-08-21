import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';

const kycSubmitSchema = z.object({
  aadhaarNumber: z.string().regex(/^\d{4}\s?\d{4}\s?\d{4}$/, 'Enter valid 12-digit Aadhaar number').optional().or(z.literal('')),
  panNumber: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Enter valid PAN (e.g., ABCDE1234F)').optional().or(z.literal('')),
  gstNumber: z.string().regex(/^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Enter valid GSTIN').optional().or(z.literal('')),
  bankAccountNo: z.string().min(1, 'Bank account number is required').optional().or(z.literal('')),
  bankIfsc: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Enter valid IFSC code').optional().or(z.literal('')),
  bankName: z.string().min(1).optional().or(z.literal('')),
  bankHolderName: z.string().min(1).optional().or(z.literal('')),
  aadhaarFrontUrl: z.string().optional().or(z.literal('')),
  aadhaarBackUrl: z.string().optional().or(z.literal('')),
  panCardUrl: z.string().optional().or(z.literal('')),
  passbookUrl: z.string().optional().or(z.literal('')),
  businessName: z.string().optional().or(z.literal('')),
  businessType: z.enum(['INDIVIDUAL', 'PROPRIETORSHIP', 'PARTNERSHIP', 'LLP', 'PRIVATE_LIMITED', 'COMPANY']).optional().or(z.literal('')),
  businessAddress: z.string().optional().or(z.literal('')),
});

export async function POST(request: NextRequest) {
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

    if (user.role !== 'OWNER') {
      return NextResponse.json({ error: 'Only seller accounts require KYC' }, { status: 403 });
    }

    if (user.kycStatus === 'VERIFIED') {
      return NextResponse.json({ error: 'KYC already verified' }, { status: 400 });
    }

    const body = await request.json();
    const parsed = kycSubmitSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return NextResponse.json({ error: firstError.message }, { status: 400 });
    }

    const data = parsed.data;

    // Clean empty strings to undefined
    const cleanData = {
      aadhaarNumber: data.aadhaarNumber || undefined,
      panNumber: data.panNumber || undefined,
      gstNumber: data.gstNumber || undefined,
      bankAccountNo: data.bankAccountNo || undefined,
      bankIfsc: data.bankIfsc || undefined,
      bankName: data.bankName || undefined,
      bankHolderName: data.bankHolderName || undefined,
      aadhaarFrontUrl: data.aadhaarFrontUrl || undefined,
      aadhaarBackUrl: data.aadhaarBackUrl || undefined,
      panCardUrl: data.panCardUrl || undefined,
      passbookUrl: data.passbookUrl || undefined,
      businessName: data.businessName || undefined,
      businessType: data.businessType || undefined,
      businessAddress: data.businessAddress || undefined,
    };

    // Validate mandatory fields for submission
    if (!cleanData.aadhaarNumber || !cleanData.panNumber) {
      return NextResponse.json({ error: 'Aadhaar number and PAN number are mandatory' }, { status: 400 });
    }

    if (!cleanData.aadhaarFrontUrl || !cleanData.aadhaarBackUrl || !cleanData.panCardUrl) {
      return NextResponse.json({ error: 'Aadhaar (front & back) and PAN card photos are mandatory' }, { status: 400 });
    }

    if (!cleanData.bankAccountNo || !cleanData.bankIfsc || !cleanData.bankHolderName) {
      return NextResponse.json({ error: 'Bank account details are mandatory' }, { status: 400 });
    }

    // Upsert the KYC record
    const kyc = await db.sellerKyc.upsert({
      where: { userId: session.userId },
      create: {
        userId: session.userId,
        ...cleanData,
        status: 'SUBMITTED',
        submittedAt: new Date(),
      },
      update: {
        ...cleanData,
        status: 'SUBMITTED',
        submittedAt: new Date(),
        // Clear rejection data on resubmission
        rejectedAt: null,
        rejectionReason: null,
        reviewedBy: null,
      },
    });

    // Update user kycStatus
    await db.user.update({
      where: { id: session.userId },
      data: { kycStatus: 'SUBMITTED' },
    });

    return NextResponse.json({ kyc, message: 'KYC documents submitted successfully for review' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Save draft (without all validations)
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const kyc = await db.sellerKyc.upsert({
      where: { userId: session.userId },
      create: {
        userId: session.userId,
        aadhaarNumber: body.aadhaarNumber || undefined,
        panNumber: body.panNumber || undefined,
        gstNumber: body.gstNumber || undefined,
        bankAccountNo: body.bankAccountNo || undefined,
        bankIfsc: body.bankIfsc || undefined,
        bankName: body.bankName || undefined,
        bankHolderName: body.bankHolderName || undefined,
        aadhaarFrontUrl: body.aadhaarFrontUrl || undefined,
        aadhaarBackUrl: body.aadhaarBackUrl || undefined,
        panCardUrl: body.panCardUrl || undefined,
        passbookUrl: body.passbookUrl || undefined,
        businessName: body.businessName || undefined,
        businessType: body.businessType || undefined,
        businessAddress: body.businessAddress || undefined,
        status: 'DRAFT',
      },
      update: {
        aadhaarNumber: body.aadhaarNumber || undefined,
        panNumber: body.panNumber || undefined,
        gstNumber: body.gstNumber || undefined,
        bankAccountNo: body.bankAccountNo || undefined,
        bankIfsc: body.bankIfsc || undefined,
        bankName: body.bankName || undefined,
        bankHolderName: body.bankHolderName || undefined,
        aadhaarFrontUrl: body.aadhaarFrontUrl || undefined,
        aadhaarBackUrl: body.aadhaarBackUrl || undefined,
        panCardUrl: body.panCardUrl || undefined,
        passbookUrl: body.passbookUrl || undefined,
        businessName: body.businessName || undefined,
        businessType: body.businessType || undefined,
        businessAddress: body.businessAddress || undefined,
        // Keep current status if already submitted
      },
    });

    return NextResponse.json({ kyc, message: 'Draft saved' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

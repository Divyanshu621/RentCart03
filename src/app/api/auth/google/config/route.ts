import { NextResponse } from 'next/server';

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const isConfigured = !!(clientId && clientId.length > 10);
  return NextResponse.json({
    configured: isConfigured,
    clientId: isConfigured ? clientId : null,
  });
}

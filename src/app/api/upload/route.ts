import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import crypto from 'crypto';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'products');
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILES = 5;
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/jpg'];

function getExtension(mimeType: string): string {
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/webp') return 'webp';
  return 'jpg';
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ensure upload directory exists
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    if (files.length > MAX_FILES) {
      return NextResponse.json({ error: `Maximum ${MAX_FILES} files allowed` }, { status: 400 });
    }

    const uploadedUrls: string[] = [];

    for (const file of files) {
      // Validate type
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: `File type "${file.type || 'unknown'}" not allowed. Use PNG, JPG, or WEBP.` },
          { status: 400 }
        );
      }

      // Validate size
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File "${file.name}" exceeds 5MB limit` },
          { status: 400 }
        );
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const ext = getExtension(file.type);
      const uniqueName = `${crypto.randomUUID().slice(0, 12)}_${Date.now()}.${ext}`;
      const filePath = path.join(UPLOAD_DIR, uniqueName);

      await writeFile(filePath, buffer);
      uploadedUrls.push(`/uploads/products/${uniqueName}`);
    }

    return NextResponse.json({ urls: uploadedUrls });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Upload failed';
    console.error('Upload error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

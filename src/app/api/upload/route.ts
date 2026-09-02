import { NextRequest } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join, extname } from 'path';
import { getSession } from '@/lib/auth';
import { rateLimiters, getClientIp, rateLimitResponse } from '@/lib/rate-limiter';
import { safeError, validationError, unauthorized, success } from '@/lib/secure-handler';
import { securityLogger } from '@/lib/security-logger';

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const ALLOWED_EXTS = ['.png', '.jpg', '.jpeg', '.webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_FILES = 5;
const VALID_CATEGORIES = ['product', 'kyc', 'profile', 'chat'];

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request);

  // Rate limit
  const rl = rateLimiters.upload.check(clientIp);
  if (!rl.allowed) return rateLimitResponse(rl);

  // Auth
  const session = await getSession(request).catch(() => null);
  if (!session) return unauthorized();

  try {
    const formData = await request.formData();
    const files = formData.getAll('file');
    const category = (formData.get('category') as string) || 'product';

    if (!VALID_CATEGORIES.includes(category)) {
      return validationError(`Invalid upload category. Allowed: ${VALID_CATEGORIES.join(', ')}`);
    }

    if (!files || files.length === 0) {
      return validationError('No files provided');
    }

    if (files.length > MAX_FILES) {
      return validationError(`Maximum ${MAX_FILES} files allowed per upload`);
    }

    const results: { url: string; originalName: string; size: number; type: string }[] = [];

    for (const file of files) {
      if (!(file instanceof File)) {
        return validationError('Invalid file format');
      }

      // Validate type
      if (!ALLOWED_TYPES.includes(file.type)) {
        return validationError(`File type "${file.type}" is not supported. Allowed: PNG, JPG, WEBP`);
      }

      // Validate size
      if (file.size > MAX_FILE_SIZE) {
        return validationError(`File "${file.name}" exceeds the 5 MB size limit`);
      }

      // Validate extension
      const ext = extname(file.name).toLowerCase();
      if (!ALLOWED_EXTS.includes(ext)) {
        return validationError(`File extension "${ext}" is not supported`);
      }

      const uuid = crypto.randomUUID();
      const filename = `${uuid}${ext}`;
      const uploadDir = join(process.cwd(), 'public', 'uploads', category);

      // Ensure directory exists
      await mkdir(uploadDir, { recursive: true });

      // Write file
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(join(uploadDir, filename), buffer);

      results.push({
        url: `/uploads/${category}/${filename}`,
        originalName: file.name,
        size: file.size,
        type: file.type,
      });
    }

    // Return single result for backward compatibility (api.ts expects single object)
    const result = results[0];
    securityLogger.info('FILE_UPLOADED', 'Upload', session.userId, {
      category,
      fileCount: results.length,
      totalSize: results.reduce((sum, r) => sum + r.size, 0),
      ip: clientIp,
    });

    return success({ ...result }, 201);
  } catch (error) {
    return safeError(error, 'Upload', session?.userId ?? null);
  }
}

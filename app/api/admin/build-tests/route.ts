import { adminRoute } from '@/lib/admin-api';
import { json } from '@/lib/api';
import { buildTests } from '@/lib/repo/admin';

export const dynamic = 'force-dynamic';

/** Достраивает недостающие тесты (существующие не трогает) */
export const POST = () => adminRoute({}, async () => json(await buildTests()));

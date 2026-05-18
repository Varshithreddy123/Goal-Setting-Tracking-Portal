import type { NextRequest } from 'next/server';
import { forbidden } from '@/utils/api';



// Enterprise requirement: no public registration.
// Admin creates users manually via protected /api/users/* endpoints.
export async function POST(_req: NextRequest) {
  return forbidden('Registration is disabled. Contact your organization admin.');
}




import { NextResponse } from 'next/server';
import { endSession } from '@/lib/auth';

export async function POST(req) {
  await endSession();
  return NextResponse.redirect(new URL('/', req.url), 303);
}

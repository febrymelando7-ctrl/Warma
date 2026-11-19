import { NextResponse } from 'next/server';
import { getProducts } from '@/lib/data';

// GET /api/products?q=sepatu
export async function GET(req) {
  const q = new URL(req.url).searchParams.get('q') || '';
  return NextResponse.json(await getProducts(q));
}

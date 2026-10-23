import {NextResponse} from 'next/server';
import {studioRepo} from '@/lib/db/store';

export async function GET() {
  return NextResponse.json(studioRepo.getConversionStats());
}

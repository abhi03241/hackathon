import {NextRequest, NextResponse} from 'next/server';
import {studioRepo} from '@/lib/db/store';

export async function GET(
  _req: NextRequest,
  {params}: {params: Promise<{memberId: string}>}
) {
  const {memberId} = await params;
  const ms = studioRepo.getLatestMembership(memberId);
  if (!ms) {
    return NextResponse.json(
      {error: 'NOT_FOUND', message: 'No membership found for member.'},
      {status: 404}
    );
  }
  return NextResponse.json(ms);
}

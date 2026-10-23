import {NextRequest, NextResponse} from 'next/server';
import {studioRepo} from '@/lib/db/store';

export async function GET(
  _req: NextRequest,
  {params}: {params: Promise<{phone: string}>}
) {
  const {phone} = await params;
  const found = studioRepo.findMemberByPhone(phone);
  if (!found) {
    return NextResponse.json(
      {error: 'MEMBER_NOT_FOUND', message: 'Member not found.'},
      {status: 404}
    );
  }
  return NextResponse.json(found);
}

import {NextRequest, NextResponse} from 'next/server';
import {studioRepo} from '@/lib/db/store';

export async function DELETE(
  _req: NextRequest,
  {params}: {params: Promise<{id: string}>}
) {
  const {id} = await params;
  const res = studioRepo.cancelBookingAndPromoteWaitlist(id);
  return NextResponse.json(
    {
      ...res,
      snapshot: studioRepo.getAllSnapshot(),
    },
    {status: res.status}
  );
}

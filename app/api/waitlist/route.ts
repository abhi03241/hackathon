import {NextRequest, NextResponse} from 'next/server';
import {JoinWaitlistSchema} from '@/lib/schemas';
import {studioRepo} from '@/lib/db/store';

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json();
    const parsed = JoinWaitlistSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: parsed.error.issues[0]?.message || 'Invalid waitlist request.',
        },
        {status: 400}
      );
    }

    const res = studioRepo.joinWaitlist(parsed.data);
    return NextResponse.json(
      {
        ...res,
        snapshot: studioRepo.getAllSnapshot(),
      },
      {status: res.status}
    );
  } catch {
    return NextResponse.json(
      {error: 'SERVER_ERROR', message: 'Could not join waitlist.'},
      {status: 500}
    );
  }
}

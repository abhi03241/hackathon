import {NextRequest, NextResponse} from 'next/server';
import {HealthIntakeSchema} from '@/lib/schemas';
import {studioRepo} from '@/lib/db/store';

export async function GET(req: NextRequest) {
  const phone = req.nextUrl.searchParams.get('phone');
  if (phone) {
    const found = studioRepo.findMemberByPhone(phone);
    if (!found) {
      return NextResponse.json(
        {error: 'MEMBER_NOT_FOUND', message: 'Member not found.'},
        {status: 404}
      );
    }
    return NextResponse.json(found);
  }
  return NextResponse.json(studioRepo.getAllSnapshot().members);
}

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json();
    const parsed = HealthIntakeSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: parsed.error.issues[0]?.message || 'Invalid health intake fields.',
          issues: parsed.error.issues,
        },
        {status: 400}
      );
    }

    const result = studioRepo.upsertMemberWithHealthProfile(parsed.data);
    return NextResponse.json(
      {
        member_id: result.member.id,
        member: result.member,
        health_profile: result.health_profile,
        routing: result.routing,
        active_membership: result.active_membership,
        has_used_trial: result.has_used_trial,
        snapshot: studioRepo.getAllSnapshot(),
      },
      {status: 201}
    );
  } catch {
    return NextResponse.json(
      {error: 'SERVER_ERROR', message: 'Failed to process health intake.'},
      {status: 500}
    );
  }
}

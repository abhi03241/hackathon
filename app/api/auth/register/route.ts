import {NextRequest, NextResponse} from 'next/server';
import {readDb, studioRepo} from '@/lib/db/store';
import type {ExperienceLevel, Goal, Condition, Membership} from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = (body.name || '').trim();
    const phone = (body.phone || '').trim().replace(/\D/g, '');
    const email = (body.email || `${phone}@ngyoga.in`).trim().toLowerCase();
    const age = Number(body.age) || 28;
    const experienceLevel = (body.experience_level || 'beginner') as ExperienceLevel;
    const mainGoal = (body.main_goal || 'fitness') as Goal;
    const conditions = (body.conditions || ['none']) as Condition[];

    if (!name || name.length < 2) {
      return NextResponse.json(
        {error: 'VALIDATION_ERROR', message: 'Name must be at least 2 characters.'},
        {status: 400}
      );
    }

    if (!/^[6-9]\d{9}$/.test(phone)) {
      return NextResponse.json(
        {error: 'VALIDATION_ERROR', message: 'Phone must be a valid 10-digit Indian mobile number.'},
        {status: 400}
      );
    }

    const {member, health_profile} = studioRepo.upsertMemberWithHealthProfile({
      name,
      phone,
      age,
      experience_level: experienceLevel,
      main_goal: mainGoal,
      conditions,
      consent_given: true,
    });

    // Generate JWT-like token for local client session
    const tokenPayload = Buffer.from(
      JSON.stringify({
        sub: member.id,
        email,
        name: member.name,
        role: 'member',
        phone: member.phone,
        tenant_id: member.tenant_id,
        iat: Date.now(),
      })
    ).toString('base64');

    const db = readDb();
    const activeMembership = db.memberships.find(
      (m: Membership) => m.member_id === member.id && m.status === 'active'
    ) || null;

    return NextResponse.json({
      access_token: `ngyoga_jwt_${tokenPayload}`,
      token_type: 'bearer',
      user: {
        id: member.id,
        email,
        name: member.name,
        role: 'member',
        phone: member.phone,
        age: member.age,
        experience_level: member.experience_level,
      },
      healthProfile: health_profile,
      activeMembership,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Registration failed.';
    return NextResponse.json({error: 'SERVER_ERROR', message: msg}, {status: 500});
  }
}

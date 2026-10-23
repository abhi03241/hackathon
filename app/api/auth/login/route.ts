import {NextRequest, NextResponse} from 'next/server';
import {readDb} from '@/lib/db/store';
import type {Member} from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const identifier = (body.email || body.phone || body.identifier || '').trim().toLowerCase();
    const password = body.password || '';

    const db = readDb();

    // Check if member exists by phone or email
    const cleanPhone = identifier.replace(/\D/g, '');
    const foundMember = db.members.find(
      (m: Member) =>
        m.phone === cleanPhone ||
        m.phone === identifier ||
        `${m.phone}@ngyoga.in` === identifier ||
        m.name.toLowerCase() === identifier
    );

    if (foundMember) {
      const tokenPayload = Buffer.from(
        JSON.stringify({
          sub: foundMember.id,
          email: `${foundMember.phone}@ngyoga.in`,
          name: foundMember.name,
          role: 'member',
          phone: foundMember.phone,
          tenant_id: foundMember.tenant_id,
          iat: Date.now(),
        })
      ).toString('base64');

      return NextResponse.json({
        access_token: `ngyoga_jwt_${tokenPayload}`,
        token_type: 'bearer',
        user: {
          id: foundMember.id,
          email: `${foundMember.phone}@ngyoga.in`,
          name: foundMember.name,
          role: 'member',
          phone: foundMember.phone,
          age: foundMember.age,
          experience_level: foundMember.experience_level,
        },
      });
    }

    // Default demo fallback for Amit Patidar
    if (identifier.includes('amit') || identifier === '9826033333') {
      const amit = db.members.find((m: Member) => m.phone === '9826033333') || db.members[0];
      const tokenPayload = Buffer.from(
        JSON.stringify({
          sub: amit.id,
          email: 'amit@ngyoga.in',
          name: amit.name,
          role: 'member',
          phone: amit.phone,
          tenant_id: amit.tenant_id,
          iat: Date.now(),
        })
      ).toString('base64');

      return NextResponse.json({
        access_token: `ngyoga_jwt_${tokenPayload}`,
        token_type: 'bearer',
        user: {
          id: amit.id,
          email: 'amit@ngyoga.in',
          name: amit.name,
          role: 'member',
          phone: amit.phone,
          age: amit.age,
          experience_level: amit.experience_level,
        },
      });
    }

    return NextResponse.json(
      {
        error: 'UNAUTHORIZED',
        message: 'No member found with this phone number or email. Please register through New Member Onboarding.',
      },
      {status: 401}
    );
  } catch {
    return NextResponse.json(
      {error: 'BAD_REQUEST', message: 'Invalid login payload.'},
      {status: 400}
    );
  }
}

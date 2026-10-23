import {NextResponse} from 'next/server';
import {studioRepo} from '@/lib/db/store';

export async function GET() {
  const triage = studioRepo.getRetentionRiskRegistry(true);
  return NextResponse.json(
    triage.filter((item) => item.risk_category === 'INACTIVE_ACTIVE_MEMBER')
  );
}

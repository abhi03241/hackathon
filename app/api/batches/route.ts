import {NextRequest, NextResponse} from 'next/server';
import {studioRepo, readDb, writeDb, getTodayDateString} from '@/lib/db/store';
import type {Batch, ProgrammeType} from '@/types';

export async function GET(req: NextRequest) {
  const programme = req.nextUrl.searchParams.get('programme') as
    | ProgrammeType
    | 'ALL'
    | null;
  const timeSlot = req.nextUrl.searchParams.get('time_slot');

  let batches = studioRepo.getAllSnapshot().batches;
  if (programme && programme !== 'ALL') {
    batches = batches.filter((b) => b.programme_type === programme);
  }
  if (timeSlot && timeSlot !== 'all') {
    batches = batches.filter((b) => b.time_slot === timeSlot);
  }
  return NextResponse.json(batches);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const db = readDb();
    const prog =
      db.programmes.find((p) => p.type === body.programme_type) ||
      db.programmes[0];

    const newBatch: Batch = {
      id: `batch-${Date.now().toString(36)}`,
      programme_id: prog.id,
      programme_type: prog.type,
      programme_name: body.programme_name || `${prog.type} Studio Cohort`,
      tenant_id: 'tenant-indore-ashok-nagar',
      time_slot: body.time_slot === 'evening' ? 'evening' : 'morning',
      timing_label: body.timing_label || '07:00 AM – 08:00 AM',
      batch_date: body.batch_date || getTodayDateString(),
      capacity: Number(body.capacity) || 12,
      booked_count: 0,
      instructor: body.instructor || prog.instructor,
      is_micro_group: Boolean(body.is_micro_group),
      is_active: true,
      created_at: new Date().toISOString(),
    };

    db.batches.unshift(newBatch);
    writeDb(db);

    return NextResponse.json(
      {
        ok: true,
        batch: newBatch,
        message: `New ${newBatch.programme_type} batch (${newBatch.timing_label}) created.`,
        snapshot: studioRepo.getAllSnapshot(),
      },
      {status: 201}
    );
  } catch {
    return NextResponse.json(
      {error: 'BAD_REQUEST', message: 'Could not create batch.'},
      {status: 400}
    );
  }
}

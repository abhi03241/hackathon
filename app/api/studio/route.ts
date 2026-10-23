import {NextRequest, NextResponse} from 'next/server';
import {studioRepo, resetDbToSeed, writeDb, DatabaseSchema} from '@/lib/db/store';

export async function GET() {
  const snapshot = studioRepo.getAllSnapshot();
  return NextResponse.json(snapshot);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (body.action === 'reset') {
      resetDbToSeed();
      return NextResponse.json({
        ok: true,
        message: 'Studio database reset to initial Ashok Nagar, Indore seed state.',
        snapshot: studioRepo.getAllSnapshot(),
      });
    }
    if (body.action === 'import' && body.data) {
      writeDb(body.data as DatabaseSchema);
      return NextResponse.json({
        ok: true,
        message: 'Studio database imported successfully.',
        snapshot: studioRepo.getAllSnapshot(),
      });
    }
    return NextResponse.json({error: 'Invalid action'}, {status: 400});
  } catch {
    return NextResponse.json({error: 'Invalid request body'}, {status: 400});
  }
}

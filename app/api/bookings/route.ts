import {NextRequest, NextResponse} from 'next/server';
import {CreateBookingSchema} from '@/lib/schemas';
import {studioRepo} from '@/lib/db/store';

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json();
    const parsed = CreateBookingSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: parsed.error.issues[0]?.message || 'Invalid booking request.',
        },
        {status: 400}
      );
    }

    const res = studioRepo.createBooking(parsed.data);
    return NextResponse.json(
      {
        ...res,
        snapshot: studioRepo.getAllSnapshot(),
      },
      {status: res.status}
    );
  } catch {
    return NextResponse.json(
      {error: 'SERVER_ERROR', message: 'Could not complete booking.'},
      {status: 500}
    );
  }
}

export async function DELETE(req: NextRequest) {
  const bookingId = req.nextUrl.searchParams.get('id');
  if (!bookingId) {
    return NextResponse.json(
      {error: 'MISSING_ID', message: 'Booking ID is required.'},
      {status: 400}
    );
  }

  const res = studioRepo.cancelBookingAndPromoteWaitlist(bookingId);
  return NextResponse.json(
    {
      ...res,
      snapshot: studioRepo.getAllSnapshot(),
    },
    {status: res.status}
  );
}

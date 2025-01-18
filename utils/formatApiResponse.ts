import { NextResponse } from 'next/server';

export function formatApiResponse(status: number, message: unknown) {
  const stringMessage = JSON.stringify(message);

  return new NextResponse(stringMessage, { status });
}

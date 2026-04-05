import { NextResponse } from 'next/server';

export async function GET() {
  try {
    return NextResponse.json([]);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
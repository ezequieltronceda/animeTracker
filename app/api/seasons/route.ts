import { NextResponse } from 'next/server';

export async function GET() {
  try {
    return NextResponse.json([]);
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
import { NextResponse } from 'next/server';

// Font variations API - returns empty for now since no project is needed
export async function GET() {
  // Return empty array - variations will be stored in localStorage
  return NextResponse.json([]);
}

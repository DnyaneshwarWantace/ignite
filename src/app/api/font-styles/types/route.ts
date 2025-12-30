import { NextResponse } from 'next/server';

// Font style types - returning basic types for now
export async function GET() {
  const types = [
    { id: '1', name: 'Sans Serif', sort: 1 },
    { id: '2', name: 'Serif', sort: 2 },
    { id: '3', name: 'Display', sort: 3 },
    { id: '4', name: 'Handwriting', sort: 4 },
  ];

  return NextResponse.json(types);
}

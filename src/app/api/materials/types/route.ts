import { NextResponse } from 'next/server';

// Material types - returning basic types for now
export async function GET() {
  const types = [
    { id: '1', name: 'Shapes', sort: 1 },
    { id: '2', name: 'Icons', sort: 2 },
    { id: '3', name: 'Illustrations', sort: 3 },
    { id: '4', name: 'Patterns', sort: 4 },
  ];

  return NextResponse.json(types);
}

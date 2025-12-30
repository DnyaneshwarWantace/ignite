import { NextResponse } from 'next/server';

// Template types - returning basic types for now
export async function GET() {
  const types = [
    { id: '1', name: 'Social Media', sort: 1 },
    { id: '2', name: 'Marketing', sort: 2 },
    { id: '3', name: 'Business', sort: 3 },
    { id: '4', name: 'Personal', sort: 4 },
  ];

  return NextResponse.json(types);
}

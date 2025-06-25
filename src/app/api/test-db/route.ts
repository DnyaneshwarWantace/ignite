import { NextResponse } from 'next/server';
import prisma from '@prisma/index';

export async function GET() {
  try {
    // Test the database connection by counting users
    const userCount = await prisma.user.count();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database connection successful',
      userCount 
    });
  } catch (error) {
    console.error('Database connection error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Database connection failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 
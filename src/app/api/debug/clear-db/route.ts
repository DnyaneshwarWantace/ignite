import { NextRequest, NextResponse } from "next/server";
import prisma from "@prisma/index";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // Stop any running services
    const { stopAutoTracking } = await import('@/rootlib/auto-tracker');
    stopAutoTracking();

    // Clear all data in reverse order of dependencies
    await prisma.ad.deleteMany();
    await prisma.brand.deleteMany();
    await prisma.folder.deleteMany();
    await prisma.session.deleteMany();
    await prisma.account.deleteMany();
    await prisma.user.deleteMany();
    await prisma.verificationToken.deleteMany();

    return NextResponse.json({
      success: true,
      message: "Database cleared successfully"
    });
  } catch (error) {
    console.error("Error clearing database:", error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 });
  }
} 
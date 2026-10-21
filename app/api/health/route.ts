import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatDatabaseError } from "@/lib/db-error";

export const dynamic = "force-dynamic";

export async function GET() {
  const envCheck = {
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    databaseUrlPrefix: process.env.DATABASE_URL
      ? process.env.DATABASE_URL.split("://")[0] + "://"
      : "MISSING",
    hasAuthSecret: !!process.env.AUTH_SECRET,
    storageDriver: process.env.STORAGE_DRIVER || "local",
    nodeEnv: process.env.NODE_ENV || "unknown",
    isVercel: !!process.env.VERCEL,
  };

  try {
    const userCount = await prisma.user.count();
    return NextResponse.json({
      status: "ok",
      database: "connected",
      userCount,
      env: envCheck,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "error",
        database: "disconnected",
        errorName: error?.name,
        errorCode: error?.code,
        errorMessage: formatDatabaseError(error),
        env: envCheck,
      },
      { status: 500 }
    );
  }
}

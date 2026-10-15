import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [dbUser, fileCount, folderCount] = await Promise.all([
      prisma.user.findUnique({
        where: { id: user.id },
        select: { storageQuotaBytes: true, storageUsedBytes: true },
      }),
      prisma.file.count({
        where: { userId: user.id, isTrash: false },
      }),
      prisma.folder.count({
        where: { userId: user.id, isTrash: false },
      }),
    ]);

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const quota = dbUser.storageQuotaBytes;
    const used = dbUser.storageUsedBytes;
    const percentage = quota > 0 ? Math.min(100, Math.round((used / quota) * 1000) / 10) : 0;

    return NextResponse.json({
      storageQuotaBytes: quota,
      storageUsedBytes: used,
      usedPercentage: percentage,
      fileCount,
      folderCount,
    });
  } catch (error: any) {
    console.error("[Get Storage Quota Error]", error);
    return NextResponse.json({ error: "Failed to fetch storage usage" }, { status: 500 });
  }
}

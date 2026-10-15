import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; versionId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const file = await prisma.file.findFirst({
      where: { id: params.id, userId: user.id },
    });

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const targetVersion = await prisma.fileVersion.findFirst({
      where: { id: params.versionId, fileId: file.id },
    });

    if (!targetVersion) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }

    // Update active version in file record
    const updated = await prisma.file.update({
      where: { id: file.id },
      data: {
        currentVersionNumber: targetVersion.versionNumber,
        sizeBytes: targetVersion.sizeBytes,
        mimeType: targetVersion.mimeType,
      },
    });

    await logAuditEvent({
      userId: user.id,
      action: "VERSION_RESTORE",
      resourceType: "FILE",
      resourceId: file.id,
      details: {
        restoredVersionNumber: targetVersion.versionNumber,
        versionId: targetVersion.id,
      },
    });

    return NextResponse.json({
      message: `Restored version ${targetVersion.versionNumber} successfully`,
      file: updated,
    });
  } catch (error: any) {
    console.error("[Restore Version Error]", error);
    return NextResponse.json({ error: "Failed to restore version" }, { status: 500 });
  }
}

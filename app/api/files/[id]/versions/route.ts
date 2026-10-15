import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { storage } from "@/lib/storage";
import { logAuditEvent } from "@/lib/audit";

const MAX_FILE_SIZE_BYTES = parseInt(process.env.MAX_FILE_SIZE_BYTES || "104857600", 10);

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const file = await prisma.file.findFirst({
      where: { id: params.id, userId: user.id },
      include: {
        versions: {
          orderBy: { versionNumber: "desc" },
          include: {
            uploadedBy: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    return NextResponse.json({
      currentVersionNumber: file.currentVersionNumber,
      versions: file.versions,
    });
  } catch (error: any) {
    console.error("[Get Versions Error]", error);
    return NextResponse.json({ error: "Failed to retrieve versions" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
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

    const formData = await req.formData();
    const uploadedFile = formData.get("file") as File | null;

    if (!uploadedFile) {
      return NextResponse.json({ error: "No replacement file provided" }, { status: 400 });
    }

    const fileSize = uploadedFile.size;
    if (fileSize > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: "File size exceeds limit" }, { status: 400 });
    }

    // Verify user quota for new version
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { storageQuotaBytes: true, storageUsedBytes: true },
    });

    if (!dbUser || dbUser.storageUsedBytes + fileSize > dbUser.storageQuotaBytes) {
      return NextResponse.json({ error: "Storage quota exceeded" }, { status: 400 });
    }

    const arrayBuffer = await uploadedFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const checksum = crypto.createHash("sha256").update(buffer).digest("hex");

    const newVersionNumber = file.currentVersionNumber + 1;
    const safeBaseName = file.originalName.replace(/[^a-zA-Z0-9_\-\.]/g, "_");
    const storageKey = `vault/${user.id}/${file.id}-v${newVersionNumber}-${safeBaseName}`;
    const mimeType = uploadedFile.type || file.mimeType;

    // Upload new version to storage
    await storage.upload(storageKey, buffer, mimeType);

    // Update database
    const createdVersion = await prisma.$transaction(async (tx) => {
      const v = await tx.fileVersion.create({
        data: {
          fileId: file.id,
          versionNumber: newVersionNumber,
          storageKey,
          sizeBytes: fileSize,
          mimeType,
          checksumSha256: checksum,
          uploadedById: user.id,
        },
      });

      await tx.file.update({
        where: { id: file.id },
        data: {
          currentVersionNumber: newVersionNumber,
          sizeBytes: fileSize,
          mimeType,
        },
      });

      await tx.user.update({
        where: { id: user.id },
        data: {
          storageUsedBytes: {
            increment: fileSize,
          },
        },
      });

      return v;
    });

    await logAuditEvent({
      userId: user.id,
      action: "VERSION_UPLOAD",
      resourceType: "FILE",
      resourceId: file.id,
      details: {
        versionNumber: newVersionNumber,
        sizeBytes: fileSize,
        checksum,
      },
    });

    return NextResponse.json({ version: createdVersion }, { status: 201 });
  } catch (error: any) {
    console.error("[Upload Version Error]", error);
    return NextResponse.json({ error: "Failed to upload new version" }, { status: 500 });
  }
}

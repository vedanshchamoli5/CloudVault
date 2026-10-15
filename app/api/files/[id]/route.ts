import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { storage } from "@/lib/storage";
import { logAuditEvent } from "@/lib/audit";
import { renameSchema } from "@/lib/validators";

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
          select: {
            id: true,
            versionNumber: true,
            sizeBytes: true,
            mimeType: true,
            checksumSha256: true,
            createdAt: true,
          },
        },
        shareLinks: {
          where: { isRevoked: false },
          select: {
            id: true,
            permission: true,
            expiresAt: true,
            downloadCount: true,
            createdAt: true,
          },
        },
      },
    });

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    return NextResponse.json({ file });
  } catch (error: any) {
    console.error("[Get File Error]", error);
    return NextResponse.json({ error: "Failed to retrieve file details" }, { status: 500 });
  }
}

export async function PATCH(
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

    const body = await req.json();
    const updateData: any = {};

    // 1. Rename
    if (typeof body.name === "string") {
      const parsed = renameSchema.safeParse({ name: body.name });
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Invalid file name", details: parsed.error.flatten().fieldErrors },
          { status: 400 }
        );
      }
      updateData.name = parsed.data.name;
    }

    // 2. Star / Unstar
    if (typeof body.isStarred === "boolean") {
      updateData.isStarred = body.isStarred;
    }

    // 3. Move to folder
    if (body.folderId !== undefined) {
      if (body.folderId === null || body.folderId === "root") {
        updateData.folderId = null;
      } else {
        const folder = await prisma.folder.findFirst({
          where: { id: body.folderId, userId: user.id, isTrash: false },
        });
        if (!folder) {
          return NextResponse.json({ error: "Target folder does not exist" }, { status: 404 });
        }
        updateData.folderId = body.folderId;
      }
    }

    // 4. Trash / Restore
    if (typeof body.isTrash === "boolean") {
      updateData.isTrash = body.isTrash;
    }

    const updated = await prisma.file.update({
      where: { id: file.id },
      data: updateData,
    });

    let action = "FILE_RENAME";
    if (typeof body.isStarred === "boolean") {
      action = body.isStarred ? "FILE_STAR" : "FILE_UNSTAR";
    } else if (body.folderId !== undefined) {
      action = "FILE_MOVE";
    } else if (typeof body.isTrash === "boolean") {
      action = body.isTrash ? "FILE_DELETE" : "FILE_RESTORE";
    }

    await logAuditEvent({
      userId: user.id,
      action: action as any,
      resourceType: "FILE",
      resourceId: file.id,
      details: updateData,
    });

    return NextResponse.json({ file: updated });
  } catch (error: any) {
    console.error("[Update File Error]", error);
    return NextResponse.json({ error: "Failed to update file" }, { status: 500 });
  }
}

export async function DELETE(
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
      include: { versions: true },
    });

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Calculate total bytes consumed by all versions of this file
    const totalBytesToDelete = file.versions.reduce((acc, v) => acc + v.sizeBytes, 0);

    // Delete all version objects from storage
    for (const version of file.versions) {
      try {
        await storage.delete(version.storageKey);
      } catch (err) {
        console.error(`[Storage Delete Error] Key: ${version.storageKey}`, err);
      }
    }

    // Delete record and decrement quota
    await prisma.$transaction(async (tx) => {
      await tx.file.delete({
        where: { id: file.id },
      });

      await tx.user.update({
        where: { id: user.id },
        data: {
          storageUsedBytes: {
            decrement: totalBytesToDelete,
          },
        },
      });
    });

    await logAuditEvent({
      userId: user.id,
      action: "FILE_PERMANENT_DELETE",
      resourceType: "FILE",
      resourceId: file.id,
      details: {
        name: file.name,
        versionsDeleted: file.versions.length,
        freedBytes: totalBytesToDelete,
      },
    });

    return NextResponse.json({
      success: true,
      message: "File permanently deleted",
      freedBytes: totalBytesToDelete,
    });
  } catch (error: any) {
    console.error("[Permanent Delete Error]", error);
    return NextResponse.json({ error: "Failed to permanently delete file" }, { status: 500 });
  }
}

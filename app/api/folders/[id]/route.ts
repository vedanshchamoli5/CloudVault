import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { renameSchema } from "@/lib/validators";
import { logAuditEvent } from "@/lib/audit";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const folder = await prisma.folder.findFirst({
      where: { id: params.id, userId: user.id },
    });

    if (!folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    const body = await req.json();
    const updateData: any = {};

    if (typeof body.name === "string") {
      const parsed = renameSchema.safeParse({ name: body.name });
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Invalid folder name", details: parsed.error.flatten().fieldErrors },
          { status: 400 }
        );
      }
      updateData.name = parsed.data.name;
    }

    if (body.parentId !== undefined) {
      if (body.parentId === null || body.parentId === "root") {
        updateData.parentId = null;
      } else {
        // Prevent moving folder into itself
        if (body.parentId === folder.id) {
          return NextResponse.json({ error: "Cannot move folder into itself" }, { status: 400 });
        }
        const targetParent = await prisma.folder.findFirst({
          where: { id: body.parentId, userId: user.id, isTrash: false },
        });
        if (!targetParent) {
          return NextResponse.json({ error: "Destination folder not found" }, { status: 404 });
        }
        updateData.parentId = body.parentId;
      }
    }

    if (typeof body.isTrash === "boolean") {
      updateData.isTrash = body.isTrash;
    }

    const updated = await prisma.folder.update({
      where: { id: folder.id },
      data: updateData,
    });

    return NextResponse.json({ folder: updated });
  } catch (error: any) {
    console.error("[Update Folder Error]", error);
    return NextResponse.json({ error: "Failed to update folder" }, { status: 500 });
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

    const folder = await prisma.folder.findFirst({
      where: { id: params.id, userId: user.id },
    });

    if (!folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    // Soft delete folder by sending to trash
    await prisma.folder.update({
      where: { id: folder.id },
      data: { isTrash: true },
    });

    await logAuditEvent({
      userId: user.id,
      action: "FOLDER_DELETE",
      resourceType: "FOLDER",
      resourceId: folder.id,
      details: { name: folder.name },
    });

    return NextResponse.json({ success: true, message: "Folder moved to trash" });
  } catch (error: any) {
    console.error("[Delete Folder Error]", error);
    return NextResponse.json({ error: "Failed to delete folder" }, { status: 500 });
  }
}

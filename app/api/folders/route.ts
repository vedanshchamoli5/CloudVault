import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createFolderSchema } from "@/lib/validators";
import { logAuditEvent } from "@/lib/audit";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const folders = await prisma.folder.findMany({
      where: { userId: user.id, isTrash: false },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        parentId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ folders });
  } catch (error: any) {
    console.error("[Get Folders Error]", error);
    return NextResponse.json({ error: "Failed to retrieve folders" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createFolderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid folder data", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, parentId } = parsed.data;

    // If parentId provided, verify parent exists and belongs to user
    if (parentId && parentId !== "root") {
      const parent = await prisma.folder.findFirst({
        where: { id: parentId, userId: user.id, isTrash: false },
      });
      if (!parent) {
        return NextResponse.json({ error: "Parent folder not found" }, { status: 404 });
      }
    }

    const folder = await prisma.folder.create({
      data: {
        name,
        userId: user.id,
        parentId: parentId && parentId !== "root" ? parentId : null,
      },
    });

    await logAuditEvent({
      userId: user.id,
      action: "FOLDER_CREATE",
      resourceType: "FOLDER",
      resourceId: folder.id,
      details: { name: folder.name, parentId: folder.parentId },
    });

    return NextResponse.json({ folder }, { status: 201 });
  } catch (error: any) {
    console.error("[Create Folder Error]", error);
    return NextResponse.json({ error: "Failed to create folder" }, { status: 500 });
  }
}

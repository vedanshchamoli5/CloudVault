import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { storage } from "@/lib/storage";
import { logAuditEvent } from "@/lib/audit";

const MAX_FILE_SIZE_BYTES = parseInt(process.env.MAX_FILE_SIZE_BYTES || "104857600", 10); // 100MB

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = req.nextUrl;
    const view = searchParams.get("view") || "all"; // all, recent, starred, trash
    const folderId = searchParams.get("folderId");
    const search = searchParams.get("search")?.trim() || "";
    const sortBy = searchParams.get("sortBy") || "name"; // name, date, size
    const order = searchParams.get("order") === "desc" ? "desc" : "asc";
    const type = searchParams.get("type") || "all";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
    const skip = (page - 1) * limit;

    // Build Prisma where clause
    const whereFile: any = {
      userId: user.id,
    };

    const whereFolder: any = {
      userId: user.id,
    };

    if (view === "trash") {
      whereFile.isTrash = true;
      whereFolder.isTrash = true;
    } else {
      whereFile.isTrash = false;
      whereFolder.isTrash = false;

      if (view === "starred") {
        whereFile.isStarred = true;
      } else if (view === "recent") {
        // Recent view displays recently updated/created files without folder nesting
      } else {
        // "all" view obeys folderId
        if (folderId && folderId !== "root" && folderId !== "null") {
          whereFile.folderId = folderId;
          whereFolder.parentId = folderId;
        } else {
          whereFile.folderId = null;
          whereFolder.parentId = null;
        }
      }
    }

    // Keyword search filter
    if (search) {
      whereFile.name = { contains: search };
      whereFolder.name = { contains: search };
      delete whereFile.folderId;
      delete whereFolder.parentId;
    }

    // Type filter
    if (type === "image") {
      whereFile.mimeType = { startsWith: "image/" };
    } else if (type === "document") {
      whereFile.OR = [
        { mimeType: { contains: "pdf" } },
        { mimeType: { contains: "text" } },
        { mimeType: { contains: "word" } },
        { mimeType: { contains: "document" } },
        { mimeType: { contains: "spreadsheet" } },
        { mimeType: { contains: "presentation" } },
        { mimeType: { contains: "json" } },
      ];
    } else if (type === "media") {
      whereFile.OR = [
        { mimeType: { startsWith: "video/" } },
        { mimeType: { startsWith: "audio/" } },
      ];
    }

    // Sort mapping
    let orderBy: any = {};
    if (sortBy === "size") {
      orderBy = { sizeBytes: order };
    } else if (sortBy === "date" || view === "recent") {
      orderBy = { updatedAt: "desc" };
    } else {
      orderBy = { name: order };
    }

    // Fetch folders (only if not filtering by non-folder views like recent or specific file types)
    let folders: any[] = [];
    if (view !== "recent" && type === "all") {
      folders = await prisma.folder.findMany({
        where: whereFolder,
        orderBy: { name: "asc" },
      });
    }

    const [totalFiles, files] = await Promise.all([
      prisma.file.count({ where: whereFile }),
      prisma.file.findMany({
        where: whereFile,
        orderBy,
        skip,
        take: limit,
      }),
    ]);

    // Build breadcrumbs if inside a folder
    const breadcrumbs: { id: string | null; name: string }[] = [{ id: null, name: "My Files" }];
    if (folderId && folderId !== "root" && folderId !== "null" && view === "all" && !search) {
      let currentId: string | null = folderId;
      const visited = new Set<string>();
      const trail: { id: string; name: string }[] = [];

      while (currentId && !visited.has(currentId)) {
        visited.add(currentId);
        const parentFolder: { id: string; name: string; parentId: string | null } | null =
          await prisma.folder.findUnique({
            where: { id: currentId, userId: user.id },
            select: { id: true, name: true, parentId: true },
          });

        if (!parentFolder) break;
        trail.unshift({ id: parentFolder.id, name: parentFolder.name });
        currentId = parentFolder.parentId;
      }

      breadcrumbs.push(...trail);
    }

    return NextResponse.json({
      files,
      folders,
      breadcrumbs,
      pagination: {
        total: totalFiles,
        page,
        limit,
        totalPages: Math.ceil(totalFiles / limit),
      },
    });
  } catch (error: any) {
    console.error("[Get Files Error]", error);
    return NextResponse.json({ error: "Failed to retrieve files" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const uploadedFile = formData.get("file") as File | null;
    const folderIdParam = formData.get("folderId") as string | null;
    const folderId = folderIdParam && folderIdParam !== "null" && folderIdParam !== "root" ? folderIdParam : null;

    if (!uploadedFile) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const fileSize = uploadedFile.size;
    if (fileSize > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: `File size exceeds the maximum limit of ${MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB` },
        { status: 400 }
      );
    }

    // Verify user storage quota
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { storageQuotaBytes: true, storageUsedBytes: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (dbUser.storageUsedBytes + fileSize > dbUser.storageQuotaBytes) {
      return NextResponse.json(
        { error: "Storage quota exceeded. Please upgrade your storage or delete existing files." },
        { status: 400 }
      );
    }

    // If folderId is provided, verify folder ownership
    if (folderId) {
      const folderExists = await prisma.folder.findFirst({
        where: { id: folderId, userId: user.id, isTrash: false },
      });
      if (!folderExists) {
        return NextResponse.json({ error: "Selected folder not found" }, { status: 404 });
      }
    }

    const arrayBuffer = await uploadedFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Compute SHA-256 Checksum
    const checksum = crypto.createHash("sha256").update(buffer).digest("hex");

    // Clean filename
    const originalName = uploadedFile.name;
    const safeBaseName = originalName.replace(/[^a-zA-Z0-9_\-\.]/g, "_");
    const fileId = crypto.randomUUID();
    const storageKey = `vault/${user.id}/${fileId}-v1-${safeBaseName}`;
    const mimeType = uploadedFile.type || "application/octet-stream";

    // Store file in object storage
    await storage.upload(storageKey, buffer, mimeType);

    // Database transaction to persist File, FileVersion, and update user storage
    const newFile = await prisma.$transaction(async (tx) => {
      const createdFile = await tx.file.create({
        data: {
          id: fileId,
          name: originalName,
          originalName,
          mimeType,
          sizeBytes: fileSize,
          userId: user.id,
          folderId,
          currentVersionNumber: 1,
        },
      });

      await tx.fileVersion.create({
        data: {
          fileId: createdFile.id,
          versionNumber: 1,
          storageKey,
          sizeBytes: fileSize,
          mimeType,
          checksumSha256: checksum,
          uploadedById: user.id,
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

      return createdFile;
    });

    await logAuditEvent({
      userId: user.id,
      action: "FILE_UPLOAD",
      resourceType: "FILE",
      resourceId: newFile.id,
      details: {
        name: newFile.name,
        sizeBytes: fileSize,
        mimeType,
        checksum,
      },
    });

    return NextResponse.json({ file: newFile }, { status: 201 });
  } catch (error: any) {
    console.error("[File Upload Error]", error);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}

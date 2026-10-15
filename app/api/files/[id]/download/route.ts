import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { storage } from "@/lib/storage";
import { logAuditEvent } from "@/lib/audit";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = req.nextUrl;
    const versionNumberParam = searchParams.get("version");
    const inline = searchParams.get("inline") === "true";

    const file = await prisma.file.findFirst({
      where: { id: params.id, userId: user.id },
      include: {
        versions: true,
      },
    });

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    let targetVersion = file.versions.find(
      (v) => v.versionNumber === file.currentVersionNumber
    );

    if (versionNumberParam) {
      const vNum = parseInt(versionNumberParam, 10);
      const found = file.versions.find((v) => v.versionNumber === vNum);
      if (found) targetVersion = found;
    }

    if (!targetVersion) {
      return NextResponse.json({ error: "File version not found" }, { status: 404 });
    }

    // Direct stream if downloaded or previewed
    const downloadData = await storage.download(targetVersion.storageKey);

    const webStream = new ReadableStream({
      start(controller) {
        downloadData.stream.on("data", (chunk) => controller.enqueue(chunk));
        downloadData.stream.on("end", () => controller.close());
        downloadData.stream.on("error", (err) => controller.error(err));
      },
    });

    const disposition = inline ? "inline" : `attachment; filename="${encodeURIComponent(file.name)}"`;

    await logAuditEvent({
      userId: user.id,
      action: "FILE_DOWNLOAD",
      resourceType: "FILE",
      resourceId: file.id,
      details: {
        version: targetVersion.versionNumber,
        inline,
        sizeBytes: targetVersion.sizeBytes,
      },
    });

    return new NextResponse(webStream, {
      headers: {
        "Content-Type": targetVersion.mimeType || downloadData.contentType,
        "Content-Length": targetVersion.sizeBytes.toString(),
        "Content-Disposition": disposition,
        "Cache-Control": "private, max-age=600",
      },
    });
  } catch (error: any) {
    console.error("[Download File Error]", error);
    return NextResponse.json({ error: "Failed to download file" }, { status: 500 });
  }
}

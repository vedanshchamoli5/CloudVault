import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { storage } from "@/lib/storage";
import { logAuditEvent } from "@/lib/audit";

export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const rawToken = params.token;
    if (!rawToken || rawToken.length < 16) {
      return NextResponse.json({ error: "Invalid share token" }, { status: 400 });
    }

    const { searchParams } = req.nextUrl;
    const inline = searchParams.get("inline") === "true";

    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

    const shareLink = await prisma.shareLink.findUnique({
      where: { tokenHash },
      include: {
        file: {
          include: {
            versions: true,
          },
        },
      },
    });

    if (!shareLink || shareLink.isRevoked) {
      return NextResponse.json({ error: "Share link not found or revoked" }, { status: 404 });
    }

    if (shareLink.expiresAt && new Date() > shareLink.expiresAt) {
      return NextResponse.json({ error: "Share link has expired" }, { status: 410 });
    }

    if (shareLink.maxDownloads && shareLink.downloadCount >= shareLink.maxDownloads) {
      return NextResponse.json({ error: "Download limit exceeded" }, { status: 410 });
    }

    if (!inline && shareLink.permission !== "DOWNLOAD") {
      return NextResponse.json({ error: "Download not permitted for this share link" }, { status: 403 });
    }

    const currentVersion = shareLink.file.versions.find(
      (v) => v.versionNumber === shareLink.file.currentVersionNumber
    );

    if (!currentVersion) {
      return NextResponse.json({ error: "Target file version not found" }, { status: 404 });
    }

    // Increment download count if this is an actual download
    if (!inline) {
      await prisma.shareLink.update({
        where: { id: shareLink.id },
        data: { downloadCount: { increment: 1 } },
      });

      await logAuditEvent({
        userId: null,
        action: "SHARE_DOWNLOAD",
        resourceType: "SHARE",
        resourceId: shareLink.id,
        details: {
          fileId: shareLink.file.id,
          fileName: shareLink.file.name,
          downloadCount: shareLink.downloadCount + 1,
        },
        ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      });
    }

    const downloadData = await storage.download(currentVersion.storageKey);

    const webStream = new ReadableStream({
      start(controller) {
        downloadData.stream.on("data", (chunk) => controller.enqueue(chunk));
        downloadData.stream.on("end", () => controller.close());
        downloadData.stream.on("error", (err) => controller.error(err));
      },
    });

    const disposition = inline
      ? "inline"
      : `attachment; filename="${encodeURIComponent(shareLink.file.name)}"`;

    return new NextResponse(webStream, {
      headers: {
        "Content-Type": currentVersion.mimeType || downloadData.contentType,
        "Content-Length": currentVersion.sizeBytes.toString(),
        "Content-Disposition": disposition,
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (error: any) {
    console.error("[Shared Download Error]", error);
    return NextResponse.json({ error: "Failed to download shared file" }, { status: 500 });
  }
}

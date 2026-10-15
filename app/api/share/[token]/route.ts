import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const rawToken = params.token;
    if (!rawToken || rawToken.length < 16) {
      return NextResponse.json({ error: "Invalid share token" }, { status: 400 });
    }

    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

    const shareLink = await prisma.shareLink.findUnique({
      where: { tokenHash },
      include: {
        file: {
          select: {
            id: true,
            name: true,
            sizeBytes: true,
            mimeType: true,
            updatedAt: true,
            user: {
              select: { name: true },
            },
          },
        },
      },
    });

    if (!shareLink || shareLink.isRevoked) {
      return NextResponse.json({ error: "This share link has been revoked or does not exist." }, { status: 404 });
    }

    // Check expiration
    if (shareLink.expiresAt && new Date() > shareLink.expiresAt) {
      return NextResponse.json({ error: "This share link has expired." }, { status: 410 });
    }

    // Check download limit
    if (shareLink.maxDownloads && shareLink.downloadCount >= shareLink.maxDownloads) {
      return NextResponse.json({ error: "This share link has reached its maximum download limit." }, { status: 410 });
    }

    return NextResponse.json({
      file: {
        name: shareLink.file.name,
        sizeBytes: shareLink.file.sizeBytes,
        mimeType: shareLink.file.mimeType,
        updatedAt: shareLink.file.updatedAt,
        ownerName: shareLink.file.user.name,
      },
      permission: shareLink.permission,
      expiresAt: shareLink.expiresAt,
    });
  } catch (error: any) {
    console.error("[Resolve Share Error]", error);
    return NextResponse.json({ error: "Failed to resolve share link" }, { status: 500 });
  }
}

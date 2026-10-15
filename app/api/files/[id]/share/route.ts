import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { shareLinkSchema } from "@/lib/validators";
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

    const file = await prisma.file.findFirst({
      where: { id: params.id, userId: user.id },
    });

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const links = await prisma.shareLink.findMany({
      where: { fileId: file.id, isRevoked: false },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ links });
  } catch (error: any) {
    console.error("[Get Share Links Error]", error);
    return NextResponse.json({ error: "Failed to retrieve share links" }, { status: 500 });
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

    const body = await req.json();
    const parsed = shareLinkSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid share link configuration", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { permission, expiresInDays, maxDownloads } = parsed.data;

    // Generate raw cryptographically secure token
    const rawToken = crypto.randomBytes(32).toString("hex");
    // Hash token with SHA-256 for secure storage in database
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

    let expiresAt: Date | null = null;
    if (expiresInDays) {
      expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);
    }

    const shareLink = await prisma.shareLink.create({
      data: {
        fileId: file.id,
        tokenHash,
        permission,
        expiresAt,
        maxDownloads: maxDownloads || null,
        downloadCount: 0,
      },
    });

    await logAuditEvent({
      userId: user.id,
      action: "SHARE_CREATE",
      resourceType: "SHARE",
      resourceId: shareLink.id,
      details: {
        fileId: file.id,
        permission,
        expiresAt,
        maxDownloads,
      },
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const shareUrl = `${baseUrl}/share/${rawToken}`;

    return NextResponse.json({
      link: shareLink,
      shareUrl,
      rawToken,
    });
  } catch (error: any) {
    console.error("[Create Share Link Error]", error);
    return NextResponse.json({ error: "Failed to create share link" }, { status: 500 });
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

    const { searchParams } = req.nextUrl;
    const linkId = searchParams.get("linkId");

    if (!linkId) {
      return NextResponse.json({ error: "linkId is required" }, { status: 400 });
    }

    // Verify ownership via file relation
    const shareLink = await prisma.shareLink.findFirst({
      where: {
        id: linkId,
        file: { userId: user.id },
      },
    });

    if (!shareLink) {
      return NextResponse.json({ error: "Share link not found" }, { status: 404 });
    }

    await prisma.shareLink.update({
      where: { id: linkId },
      data: { isRevoked: true },
    });

    await logAuditEvent({
      userId: user.id,
      action: "SHARE_REVOKE",
      resourceType: "SHARE",
      resourceId: linkId,
      details: { fileId: shareLink.fileId },
    });

    return NextResponse.json({ success: true, message: "Share link revoked successfully" });
  } catch (error: any) {
    console.error("[Revoke Share Link Error]", error);
    return NextResponse.json({ error: "Failed to revoke share link" }, { status: 500 });
  }
}

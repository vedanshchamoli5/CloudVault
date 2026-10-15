import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSessionToken, getSessionCookieOptions } from "@/lib/auth";
import { registerSchema } from "@/lib/validators";
import { logAuditEvent } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, password, name } = parsed.data;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email address already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const quotaBytes = parseFloat(process.env.DEFAULT_USER_QUOTA_BYTES || "10737418240");

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        storageQuotaBytes: quotaBytes,
        storageUsedBytes: 0,
      },
    });

    const sessionToken = createSessionToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    await logAuditEvent({
      userId: user.id,
      action: "AUTH_REGISTER",
      resourceType: "AUTH",
      details: { email: user.email },
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
    });

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        storageQuotaBytes: user.storageQuotaBytes,
        storageUsedBytes: user.storageUsedBytes,
      },
    });

    const cookieOpts = getSessionCookieOptions();
    response.cookies.set(cookieOpts.name, sessionToken, cookieOpts);

    return response;
  } catch (error: any) {
    console.error("[Register Error]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

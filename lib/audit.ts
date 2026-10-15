import { prisma } from "./prisma";

export type AuditAction =
  | "FILE_UPLOAD"
  | "FILE_DOWNLOAD"
  | "FILE_RENAME"
  | "FILE_DELETE"
  | "FILE_RESTORE"
  | "FILE_PERMANENT_DELETE"
  | "FILE_MOVE"
  | "FILE_STAR"
  | "FILE_UNSTAR"
  | "FOLDER_CREATE"
  | "FOLDER_DELETE"
  | "VERSION_UPLOAD"
  | "VERSION_RESTORE"
  | "SHARE_CREATE"
  | "SHARE_REVOKE"
  | "SHARE_DOWNLOAD"
  | "AUTH_LOGIN"
  | "AUTH_REGISTER";

export async function logAuditEvent(params: {
  userId?: string | null;
  action: AuditAction;
  resourceType: "FILE" | "FOLDER" | "SHARE" | "AUTH" | "USER";
  resourceId?: string | null;
  details?: Record<string, any>;
  ipAddress?: string | null;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId || null,
        action: params.action,
        resourceType: params.resourceType,
        resourceId: params.resourceId || null,
        details: params.details ? JSON.stringify(params.details) : null,
        ipAddress: params.ipAddress || null,
      },
    });
  } catch (error) {
    // Avoid crashing primary flows if audit write encounters a transient error
    console.error("[AuditLog Error]", error);
  }
}

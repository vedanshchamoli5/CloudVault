const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

async function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString("hex");
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${salt}:${derivedKey.toString("hex")}`);
    });
  });
}

async function main() {
  console.log("🌱 Seeding CloudVault database...");

  const email = "demo@cloudvault.dev";
  const password = "DemoPassword123!";
  const passwordHash = await hashPassword(password);

  // Upsert demo user
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name: "Vedansh Chamoli",
    },
    create: {
      email,
      name: "Vedansh Chamoli",
      passwordHash,
      role: "USER",
      storageQuotaBytes: 10737418240, // 10 GB
      storageUsedBytes: 0,
    },
  });

  console.log(`👤 Demo User created: ${user.email} (Password: ${password})`);

  // Ensure uploads directory exists for local driver
  const uploadsDir = path.resolve(__dirname, "..", "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Create Folders
  const workFolder = await prisma.folder.create({
    data: {
      name: "Engineering Projects",
      userId: user.id,
    },
  });

  const docsFolder = await prisma.folder.create({
    data: {
      name: "Q4 System Specifications",
      userId: user.id,
      parentId: workFolder.id,
    },
  });

  const assetsFolder = await prisma.folder.create({
    data: {
      name: "Brand & Assets",
      userId: user.id,
    },
  });

  console.log("📁 Folders created.");

  // Helper to create file with versions on disk
  async function seedFile(params) {
    const fileId = crypto.randomUUID();
    const safeBaseName = params.name.replace(/[^a-zA-Z0-9_\-\.]/g, "_");
    const buffer = Buffer.from(params.content, "utf-8");
    const checksum = crypto.createHash("sha256").update(buffer).digest("hex");
    const storageKey = `vault/${user.id}/${fileId}-v1-${safeBaseName}`;

    // Write file to uploads directory
    const diskPath = path.join(uploadsDir, storageKey.replace(/[^a-zA-Z0-9_\-\.]/g, "_"));
    fs.writeFileSync(diskPath, buffer);
    fs.writeFileSync(
      `${diskPath}.meta.json`,
      JSON.stringify({ contentType: params.mimeType, size: buffer.length })
    );

    const file = await prisma.file.create({
      data: {
        id: fileId,
        name: params.name,
        originalName: params.name,
        mimeType: params.mimeType,
        sizeBytes: buffer.length,
        userId: user.id,
        folderId: params.folderId || null,
        isStarred: params.isStarred || false,
        currentVersionNumber: 1,
      },
    });

    await prisma.fileVersion.create({
      data: {
        fileId: file.id,
        versionNumber: 1,
        storageKey,
        sizeBytes: buffer.length,
        mimeType: params.mimeType,
        checksumSha256: checksum,
        uploadedById: user.id,
      },
    });

    return file;
  }

  // Create sample files
  const file1 = await seedFile({
    name: "cloudvault-architecture-v1.md",
    mimeType: "text/markdown",
    content: `# CloudVault Architecture Overview\n\n- S3-compatible private storage\n- PostgreSQL database\n- Cryptographically hashed share links\n- Multi-version file tracking\n`,
    folderId: docsFolder.id,
    isStarred: true,
  });

  const file2 = await seedFile({
    name: "database-schema-spec.sql",
    mimeType: "text/plain",
    content: `-- CloudVault Relational Schema Definition\nCREATE TABLE users (id TEXT PRIMARY KEY, email TEXT UNIQUE);\n`,
    folderId: docsFolder.id,
    isStarred: false,
  });

  const file3 = await seedFile({
    name: "quarterly-security-audit.txt",
    mimeType: "text/plain",
    content: `Security Audit Summary:\n- Presigned URLs: Verified\n- Hashed Share Tokens: Verified\n- Storage Isolation: Verified\n`,
    folderId: null,
    isStarred: true,
  });

  // Create a share link for file 1
  const rawToken = "demo-share-token-398bfa2e9a8f";
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

  await prisma.shareLink.upsert({
    where: { tokenHash },
    update: {},
    create: {
      fileId: file1.id,
      tokenHash,
      permission: "DOWNLOAD",
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      downloadCount: 3,
      maxDownloads: 50,
    },
  });

  // Calculate and update user's storage
  const totalFiles = await prisma.file.findMany({
    where: { userId: user.id },
    select: { sizeBytes: true },
  });
  const totalBytes = totalFiles.reduce((acc, f) => acc + f.sizeBytes, 0);

  await prisma.user.update({
    where: { id: user.id },
    data: { storageUsedBytes: totalBytes },
  });

  console.log(`✅ Demo database seed complete! Total files: ${totalFiles.length}, Used: ${totalBytes} bytes.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

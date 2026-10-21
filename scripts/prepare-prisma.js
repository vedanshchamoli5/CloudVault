const fs = require("fs");
const path = require("path");

const schemaPath = path.join(__dirname, "..", "prisma", "schema.prisma");
if (!fs.existsSync(schemaPath)) {
  console.warn("[Prisma Prep] Warning: prisma/schema.prisma not found.");
  process.exit(0);
}

let schemaContent = fs.readFileSync(schemaPath, "utf8");
const dbUrl = process.env.DATABASE_URL || "";
const isPostgres =
  dbUrl.startsWith("postgres://") ||
  dbUrl.startsWith("postgresql://") ||
  process.env.VERCEL === "1" ||
  process.env.RENDER === "true" ||
  process.env.NODE_ENV === "production";

if (isPostgres) {
  if (schemaContent.includes('provider = "sqlite"')) {
    console.log("[Prisma Prep] Switching datasource provider to 'postgresql' for PostgreSQL/Cloud deployment.");
    schemaContent = schemaContent.replace('provider = "sqlite"', 'provider = "postgresql"');
    fs.writeFileSync(schemaPath, schemaContent, "utf8");
  }
} else if (dbUrl.startsWith("file:") || (!dbUrl && !process.env.VERCEL && !process.env.RENDER)) {
  if (schemaContent.includes('provider = "postgresql"')) {
    console.log("[Prisma Prep] Switching datasource provider to 'sqlite' for local SQLite development.");
    schemaContent = schemaContent.replace('provider = "postgresql"', 'provider = "sqlite"');
    fs.writeFileSync(schemaPath, schemaContent, "utf8");
  }
}
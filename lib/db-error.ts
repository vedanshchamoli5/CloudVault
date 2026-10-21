export function formatDatabaseError(error: any): string {
  if (!process.env.DATABASE_URL) {
    return "DATABASE_URL environment variable is missing. Please configure your PostgreSQL connection in your deployment settings (e.g. Vercel Project Settings > Environment Variables).";
  }

  if (error?.code === "P1001") {
    return "Cannot reach database server. Please verify your DATABASE_URL host, port, and network permissions.";
  }

  if (error?.code === "P1000") {
    return "Database authentication failed. Please verify your DATABASE_URL username and password.";
  }

  if (error?.code === "P2021") {
    return "Database tables have not been created yet. Please run 'npx prisma db push' to apply the schema to your database.";
  }

  if (error?.message?.includes("The database URL must start with the protocol file: for SQLite")) {
    return "Schema provider mismatch: your database URL is PostgreSQL but Prisma was configured for SQLite. The build will now automatically handle this.";
  }

  return error?.message || "An unexpected database error occurred.";
}

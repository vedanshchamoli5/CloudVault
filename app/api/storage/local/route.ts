import { NextRequest, NextResponse } from "next/server";
import { LocalStorageProvider } from "@/lib/storage/local";
import { Readable } from "stream";

export const dynamic = "force-dynamic";

const localProvider = new LocalStorageProvider();

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const key = searchParams.get("key");
    const action = searchParams.get("action");
    const expires = parseInt(searchParams.get("expires") || "0", 10);
    const token = searchParams.get("token");

    if (!key || !action || !expires || !token) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    const isValid = localProvider.verifyToken(key, action, expires, token);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid or expired storage token" }, { status: 403 });
    }

    const file = await localProvider.download(key);

    // Convert NodeJS.ReadableStream to web ReadableStream
    const webStream = new ReadableStream({
      start(controller) {
        file.stream.on("data", (chunk) => controller.enqueue(chunk));
        file.stream.on("end", () => controller.close());
        file.stream.on("error", (err) => controller.error(err));
      },
    });

    return new NextResponse(webStream, {
      headers: {
        "Content-Type": file.contentType,
        "Content-Length": file.size.toString(),
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error: any) {
    console.error("[Local Storage Download Error]", error);
    return NextResponse.json({ error: "File not found or inaccessible" }, { status: 404 });
  }
}

import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { isValidAdminSecret } from "@/lib/adminAuth";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const adminSecret = formData.get("adminSecret") as string;
    const file = formData.get("file") as File;

    if (!isValidAdminSecret(adminSecret)) {
      return new Response("Unauthorized", { status: 401 });
    }

    if (!file) {
      return new Response("No file provided", { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filename = `${timestamp}-${sanitizedName}`;
    const filepath = path.join(uploadsDir, filename);

    await writeFile(filepath, buffer);

    // Return the public URL
    const url = `/uploads/${filename}`;
    return Response.json({ url });
  } catch (error: any) {
    console.error("Upload error:", error);
    return new Response(error?.message ?? "Upload failed", { status: 500 });
  }
}

import { put } from "@vercel/blob";
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

    // Upload to Vercel Blob
    const blob = await put(file.name, file, {
      access: "public",
    });

    return Response.json({ url: blob.url });
  } catch (error: any) {
    console.error("Upload error:", error);
    return new Response(error?.message ?? "Upload failed", { status: 500 });
  }
}

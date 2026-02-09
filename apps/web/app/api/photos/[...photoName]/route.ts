// app/api/photos/[...photoName]/route.ts
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ photoName: string[] }> }
) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return new Response("Missing GOOGLE_MAPS_API_KEY", { status: 500 });

  const { photoName } = await params;
  const photoPath = photoName.join("/"); // reconstruct "places/.../photos/..."
  const url =
    `https://places.googleapis.com/v1/${photoPath}/media` +
    `?maxWidthPx=1600`;

  // Fetch the binary image and stream it back
  const res = await fetch(url, {
    headers: {
      "X-Goog-Api-Key": apiKey,
    },
    redirect: "follow",
  });

  if (!res.ok) {
    const text = await res.text();
    return new Response(`Photo fetch failed: ${text}`, { status: res.status });
  }

  const contentType = res.headers.get("content-type") || "image/jpeg";
  return new Response(res.body, {
    headers: {
      "content-type": contentType,
      "cache-control": "public, max-age=86400",
    },
  });
}

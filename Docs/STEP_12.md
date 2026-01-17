# STEP_12 – Draft / Publish Workflow (published + featured) + Safer Public Pages

Goal:
- New places added via Telegram ingest should NOT instantly go public.
- Add `published` and `featured` flags in DB.
- Public pages (`/places`, `/places/[id]`) show only published places.
- Admin can review drafts and publish/feature them.

End result:
- You can add places fast without worrying about messy entries showing up live.

---

## 0) Add fields to Prisma schema

Open `prisma/schema.prisma` and add these fields to `Place`:

```prisma
model Place {
  id            String   @id
  name          String
  neighborhood  String
  category      PlaceCategory

  tags          Json
  goodFor       Json?
  rating        Float
  shortBlurb    String
  longReview    String?
  priceLevel    Int?
  googleMapsUrl String?

  googlePlaceId String?  @unique
  address       String?
  lat           Float?
  lng           Float?
  googleMapsUri String?

  primaryPhotoName String?
  primaryPhotoUrl  String?

  // NEW: publishing controls
  published     Boolean  @default(false)
  featured      Boolean  @default(false)

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
Run migration:

npx prisma migrate dev --name add_publish_flags
1) Make ingest create drafts by default
Open app/api/ingest/route.ts.

1.1 On create: set published: false
In the prisma.place.create({ data: { ... } }) block, add:

published: false,
featured: false,
1.2 On update: DO NOT automatically publish
In the update block, do NOT change published unless you explicitly want it.
Make sure you are NOT overwriting it.

(If your update data object doesn’t mention published, you’re good.)

2) Public pages: show only published places
2.1 Update /places query
Open app/places/page.tsx (server component).

Change:

const places = await prisma.place.findMany({ ... });
to:

const places = await prisma.place.findMany({
  where: { published: true },
  orderBy: { createdAt: "desc" },
});
Now public /places only shows published entries.

2.2 Update /places/[id] to 404 if not published
Open app/places/[id]/page.tsx.

Instead of fetching by id only, do:

const place = await prisma.place.findFirst({
  where: { id: params.id, published: true },
});
If not found → notFound().

✅ Draft entries won’t be accessible publicly.

3) Admin: show drafts + published separately
Open app/admin/page.tsx.

Replace your query:

const places = await prisma.place.findMany({
  orderBy: { updatedAt: "desc" },
});
with two queries:

const drafts = await prisma.place.findMany({
  where: { published: false },
  orderBy: { updatedAt: "desc" },
});

const published = await prisma.place.findMany({
  where: { published: true },
  orderBy: { updatedAt: "desc" },
});
Then render two sections:

Drafts (needs review)

Published

Example structure:

<h2 className="mb-2 font-serif text-2xl">Drafts</h2>
... list drafts ...

<h2 className="mt-10 mb-2 font-serif text-2xl">Published</h2>
... list published ...
In the draft row, add a small “Publish” button later (next step).

4) Add an admin endpoint to toggle publish/feature
Create a dedicated endpoint so the admin UI can quickly toggle flags.

Create:
app/api/admin/places/[id]/flags/route.ts

import { prisma } from "@/lib/prisma";
import { isValidAdminSecret } from "@/lib/adminAuth";

type Body = {
  adminSecret?: string;
  published?: boolean;
  featured?: boolean;
};

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const body = (await req.json()) as Body;

  if (!isValidAdminSecret(body.adminSecret)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const data: any = {};
  if (typeof body.published === "boolean") data.published = body.published;
  if (typeof body.featured === "boolean") data.featured = body.featured;

  const updated = await prisma.place.update({
    where: { id: params.id },
    data,
  });

  return Response.json(updated);
}
5) Update Admin Edit page to include Published + Featured toggles
Open components/AdminEditClient.tsx.

5.1 Add initial values
In props type include:

published?: boolean;
featured?: boolean;
Then in state:

const [published, setPublished] = useState(!!(place as any).published);
const [featured, setFeatured] = useState(!!(place as any).featured);
5.2 Add UI toggles near the top
Add somewhere in the form:

<div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
  <div className="flex items-center justify-between">
    <div>
      <div className="text-sm font-medium">Published</div>
      <div className="text-xs text-textMuted">If off, it won't show on public pages.</div>
    </div>
    <button
      onClick={async () => {
        setBusy(true); setStatus(null);
        const res = await fetch(`/api/admin/places/${place.id}/flags`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ adminSecret, published: !published }),
        });
        setBusy(false);
        if (!res.ok) return setStatus(`Toggle failed (${res.status})`);
        setPublished(!published);
        setStatus("Updated ✅");
      }}
      disabled={busy}
      className={[
        "rounded-full px-4 py-2 text-sm font-medium transition disabled:opacity-60",
        published ? "bg-secondary text-white" : "bg-[#FDF8F3] border border-[#D8C7B8] text-textMain",
      ].join(" ")}
    >
      {published ? "Published" : "Draft"}
    </button>
  </div>

  <div className="mt-4 flex items-center justify-between">
    <div>
      <div className="text-sm font-medium">Featured</div>
      <div className="text-xs text-textMuted">Can be used for homepage picks.</div>
    </div>
    <button
      onClick={async () => {
        setBusy(true); setStatus(null);
        const res = await fetch(`/api/admin/places/${place.id}/flags`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ adminSecret, featured: !featured }),
        });
        setBusy(false);
        if (!res.ok) return setStatus(`Toggle failed (${res.status})`);
        setFeatured(!featured);
        setStatus("Updated ✅");
      }}
      disabled={busy}
      className={[
        "rounded-full px-4 py-2 text-sm font-medium transition disabled:opacity-60",
        featured ? "bg-primary text-white" : "bg-[#FDF8F3] border border-[#D8C7B8] text-textMain",
      ].join(" ")}
    >
      {featured ? "Featured" : "Not featured"}
    </button>
  </div>
</div>
This keeps toggles separate from the big “Save changes” flow.

6) Add a quick “Publish” button directly on the admin list (optional but great)
In app/admin/page.tsx, in the Drafts list row, add:

A link to edit

A button that publishes it

Because app/admin/page.tsx is a server component, simplest approach:

Link to edit, and publish from edit page.
If you want one-click publish here, we can make a small client component row.

(If you want, I’ll provide a tiny AdminPlaceRowClient for this.)

7) Update bot success message to reflect draft status
In bot/index.ts, after ingest succeeds, you can say:

“Added ✅ (Draft) … Review at: /admin/edit/<id>”

You can change the message to:

const adminEditUrl = `${baseUrl}/admin/edit/${json.place.id}`;
return bot.sendMessage(
  msg.chat.id,
  `Added ✅ (Draft) ${json.place.name}\nReview + publish:\n${adminEditUrl}`
);
This encourages the right workflow.

8) Checklist for STEP_12
 Prisma migrated with published and featured

 Ingest creates published=false drafts

 Public /places shows only published places

 Public /places/[id] 404s for drafts

 Admin can toggle Published/Featured on edit page

 Telegram bot points you to admin review link
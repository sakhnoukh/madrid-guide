# STEP_1 – Skeleton Layout + Hero

Goal of this step:  
Have a **single-page layout** running locally with:

- Fixed top nav  
- Fullscreen hero with video background + overlay + centered text  
- Empty sections for `Places`, `Collections`, and `About`  

No real data, no backend, no bot yet.

---

## 0. Assumptions

- You’re using **Next.js + TypeScript + Tailwind CSS**.
- If you already have a project, just adapt the file names and paths.

If you don’t have a project yet, start from:

```bash
npx create-next-app@latest samis-guide
# When prompted: TypeScript = yes, Tailwind = yes
cd samis-guide
Then:

bash
Copy code
npm run dev
# or
pnpm dev
# or
yarn dev
Open http://localhost:3000 to confirm it runs.

1. Clean up the default Next.js stuff
Open app/page.tsx (or pages/index.tsx if using pages router).

Delete the default starter JSX.

Replace it with a basic layout shell:

tsx
Copy code
export default function Home() {
  return (
    <main className="min-h-screen bg-[#F7F3EC] text-[#4B4B4B]">
      {/* Top nav */}
      {/* Hero */}
      {/* Places section */}
      {/* Collections section */}
      {/* About section */}
    </main>
  );
}
You should now see a blank warm off-white page.

2. Configure fonts (serif for headings, sans for body)
2.1 Install Google Fonts (Next.js app router style)
In app/layout.tsx (or _app.tsx + _document.tsx if pages router), add fonts.

Example using Next.js font helpers:

tsx
Copy code
// app/layout.tsx
import "./globals.css";
import { Inter, Playfair_Display } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
});

export const metadata = {
  title: "Sami's Guide to Madrid",
  description: "Places I actually go to in Madrid.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-sans bg-[#F7F3EC] text-[#4B4B4B]">
        {children}
      </body>
    </html>
  );
}
2.2 Update Tailwind config for font classes (optional but nice)
In tailwind.config.js:

js
Copy code
const { fontFamily } = require("tailwindcss/defaultTheme");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./pages/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", ...fontFamily.sans],
        serif: ["var(--font-serif)", ...fontFamily.serif],
      },
      colors: {
        background: "#F7F3EC",
        primary: "#D46A4C",
        secondary: "#1E3A5F",
        textMain: "#4B4B4B",
        textMuted: "#9A9A9A",
      },
    },
  },
  plugins: [],
};
Now you can use font-serif for headings and font-sans for everything else.

3. Add a fixed top navigation
In app/page.tsx, start filling in the layout:

tsx
Copy code
export default function Home() {
  return (
    <main className="min-h-screen bg-background text-textMain">
      {/* NAVBAR */}
      <header className="fixed top-0 left-0 right-0 z-20">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="font-serif text-lg tracking-wide">
            Sami&apos;s Guide
          </div>
          <div className="hidden gap-6 text-sm md:flex">
            <a href="#places" className="hover:text-primary transition-colors">
              Places
            </a>
            <a href="#collections" className="hover:text-primary transition-colors">
              Collections
            </a>
            <a href="#about" className="hover:text-primary transition-colors">
              About
            </a>
          </div>
        </nav>
      </header>

      {/* PAGE CONTENT */}
      <div className="pt-16">
        {/* Hero */}
        {/* Places */}
        {/* Collections */}
        {/* About */}
      </div>
    </main>
  );
}
For now, ignore mobile nav; desktop nav is enough to start.

4. Implement the hero section with video background
Still in app/page.tsx, under the pt-16 div, add the Hero:

tsx
Copy code
      <div className="pt-16">
        {/* HERO */}
        <section
          id="hero"
          className="relative flex min-h-[100vh] items-center justify-center overflow-hidden"
        >
          {/* Background video */}
          <video
            className="absolute inset-0 h-full w-full object-cover"
            autoPlay
            loop
            muted
            playsInline
          >
            {/* TEMP: replace src with your real video later */}
            <source src="/videos/candle-placeholder.mp4" type="video/mp4" />
          </video>

          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/50" />

          {/* Centered content */}
          <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center px-4 text-center text-[#F7F3EC]">
            <p className="mb-2 text-xs uppercase tracking-[0.25em] text-[#E4D3C2]">
              Sami&apos;s guide to Madrid
            </p>
            <h1 className="mb-4 font-serif text-4xl sm:text-5xl md:text-6xl leading-tight">
              Places I actually go to.
            </h1>
            <p className="mb-8 max-w-xl text-sm sm:text-base text-[#F1E4D7]">
              Cafés to read in, bars to talk in, and restaurants that feel worth
              the bill.
            </p>

            <button
              onClick={() => {
                const el = document.getElementById("places");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className="rounded-full border border-[#F1E4D7]/60 px-6 py-2 text-xs uppercase tracking-[0.2em] hover:bg-[#F1E4D7]/10 transition"
            >
              Scroll to explore
            </button>
          </div>
        </section>

        {/* Places */}
        {/* Collections */}
        {/* About */}
      </div>
For now, the video path /videos/candle-placeholder.mp4 is just a placeholder. You can:

Create public/videos folder.

Drop any temporary MP4 there to check the layout.

Later replace it with your real candle clip.

Also add this to globals.css if you want smooth scrolling globally:

css
Copy code
html {
  scroll-behavior: smooth;
}
5. Add empty sections for Places, Collections, About
Under the hero section, still in app/page.tsx, add basic placeholders:

tsx
Copy code
        {/* PLACES SECTION */}
        <section
          id="places"
          className="mx-auto max-w-6xl px-4 py-16 sm:py-20"
        >
          <h2 className="mb-4 font-serif text-2xl sm:text-3xl">
            Latest places
          </h2>
          <p className="mb-8 max-w-xl text-sm text-textMuted">
            A few spots I&apos;ve been to recently and would actually recommend.
          </p>

          {/* TODO: place cards grid in STEP_2 */}
          <div className="rounded-2xl border border-dashed border-textMuted/30 p-6 text-sm text-textMuted">
            Place cards will go here in the next step.
          </div>
        </section>

        {/* COLLECTIONS SECTION */}
        <section
          id="collections"
          className="mx-auto max-w-6xl px-4 py-16 sm:py-20"
        >
          <h2 className="mb-4 font-serif text-2xl sm:text-3xl">
            Collections
          </h2>
          <p className="mb-8 max-w-xl text-sm text-textMuted">
            Curated sets of places for different moods and situations.
          </p>

          <div className="rounded-2xl border border-dashed border-textMuted/30 p-6 text-sm text-textMuted">
            Collection cards will go here in the next step.
          </div>
        </section>

        {/* ABOUT SECTION */}
        <section
          id="about"
          className="mx-auto max-w-6xl px-4 py-16 sm:py-20"
        >
          <h2 className="mb-4 font-serif text-2xl sm:text-3xl">
            About this guide
          </h2>
          <div className="space-y-3 text-sm sm:text-base text-textMain max-w-2xl">
            <p>
              This is a personal map of Madrid: cafés, restaurants, and bars I
              actually spend time in.
            </p>
            <p>
              I only add places after I&apos;ve been there, and I try to be
              honest about what they&apos;re good for: studying, dates, long
              conversations, or just a quick coffee.
            </p>
            <p>
              If I wouldn&apos;t bring a friend here, it&apos;s probably not on
              this site.
            </p>
          </div>
        </section>
At this point you’ll have:

Fixed nav.

Candle-style hero with video background and overlay.

Three clearly separated sections with placeholder content.

6. Quick checklist before moving on
By the end of STEP_1 you should have:

 Project runs locally (npm run dev)

 Global background = warm off-white (#F7F3EC)

 Fonts working (serif for headings, sans for body)

 Fixed nav at the top with links to Places, Collections, About

 Hero section:

 Full viewport height

 Video in the background

 Dark overlay

 Title + subtitle + “Scroll to explore” button

 Sections for Places, Collections, About with placeholder boxes
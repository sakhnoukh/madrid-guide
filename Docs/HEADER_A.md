# HEADER_A – Glass header with soft fade (no harsh blur edge)

This header style:
- Uses a translucent “glass” background (`backdrop-blur`)
- Avoids a hard border line
- Adds a subtle gradient fade under the header so it blends into the page

---

## 1) Drop-in JSX structure

Use this structure for your header (App Router layout or Header component):

```tsx
<header className="fixed top-0 z-50 w-full">
  {/* Glass bar */}
  <div className="bg-white/10 backdrop-blur-xl">
    <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
      {/* Left */}
      <a href="/" className="font-serif text-sm tracking-wide text-white/90">
        Sami&apos;s Guide
      </a>

      {/* Right nav */}
      <nav className="flex items-center gap-6 text-sm text-white/80">
        <a href="/places" className="hover:text-white transition">
          Places
        </a>
        <a href="/collections" className="hover:text-white transition">
          Collections
        </a>
        <a href="/about" className="hover:text-white transition">
          About
        </a>
      </nav>
    </div>
  </div>

  {/* Soft fade (replaces hard border) */}
  <div className="h-6 bg-gradient-to-b from-white/10 to-transparent" />
</header>
2) Make sure your page content doesn’t hide behind the header
Because the header is fixed, add top padding to the page wrapper (or main content) so content starts below it.

Typical:

<main className="pt-20">
  ...
</main>
If your header feels taller/shorter, adjust pt-20.

3) Variants (pick based on background)
If your hero/background is dark, keep as-is.

If your hero/background is light, switch to:

glass background:

bg-black/10 instead of bg-white/10

text colors:

text-black/80 + hover:text-black

Example:

- <div className="bg-white/10 backdrop-blur-xl">
+ <div className="bg-black/10 backdrop-blur-xl">

- className="... text-white/90"
+ className="... text-black/90"
4) Notes
The gradient strip is what removes the “hard blur edge.”

Keep background opacity low (/5 to /15) for the cleanest glass effect.
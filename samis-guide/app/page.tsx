"use client";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#F7F3EC] text-[#4B4B4B]">
      {/* NAVBAR */}
      <header className="fixed top-0 left-0 right-0 z-20">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="font-serif text-lg tracking-wide">
            Sami&apos;s Guide
          </div>
          <div className="hidden gap-6 text-sm md:flex">
            <a href="#places" className="hover:text-[#D46A4C] transition-colors">
              Places
            </a>
            <a href="#collections" className="hover:text-[#D46A4C] transition-colors">
              Collections
            </a>
            <a href="#about" className="hover:text-[#D46A4C] transition-colors">
              About
            </a>
          </div>
        </nav>
      </header>

      {/* PAGE CONTENT */}
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

        {/* PLACES SECTION */}
        <section
          id="places"
          className="mx-auto max-w-6xl px-4 py-16 sm:py-20"
        >
          <h2 className="mb-4 font-serif text-2xl sm:text-3xl">
            Latest places
          </h2>
          <p className="mb-8 max-w-xl text-sm text-[#9A9A9A]">
            A few spots I&apos;ve been to recently and would actually recommend.
          </p>

          <div className="rounded-2xl border border-dashed border-[#9A9A9A]/30 p-6 text-sm text-[#9A9A9A]">
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
          <p className="mb-8 max-w-xl text-sm text-[#9A9A9A]">
            Curated sets of places for different moods and situations.
          </p>

          <div className="rounded-2xl border border-dashed border-[#9A9A9A]/30 p-6 text-sm text-[#9A9A9A]">
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
          <div className="space-y-3 text-sm sm:text-base text-[#4B4B4B] max-w-2xl">
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
      </div>
    </main>
  );
}

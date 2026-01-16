export default function HomePage() {
  return (
    <div className="min-h-screen">
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
          <h1 className="mb-4 font-serif text-4xl leading-tight sm:text-5xl md:text-6xl">
            Places I actually go to.
          </h1>
          <p className="mb-8 max-w-xl text-sm text-[#F1E4D7] sm:text-base">
            Cafés to read in, bars to talk in, and restaurants that feel worth
            the bill.
          </p>
        </div>
      </section>

      {/* ABOUT ON HOME */}
      <section
        id="about"
        className="mx-auto max-w-6xl px-4 py-16 sm:py-20"
      >
        <h2 className="mb-4 font-serif text-2xl sm:text-3xl">
          About this guide
        </h2>
        <div className="max-w-2xl space-y-3 text-sm text-[#4B4B4B] sm:text-base">
          <p>
            This is a personal map of Madrid: cafés, restaurants, and bars I
            actually spend time in.
          </p>
          <p>
            I only add places after I&apos;ve been there, and I try to be honest
            about what they&apos;re good for: studying, dates, long
            conversations, or just a quick coffee.
          </p>
          <p>
            If I wouldn&apos;t bring a friend here, it&apos;s probably not on
            this site.
          </p>
        </div>
      </section>
    </div>
  );
}

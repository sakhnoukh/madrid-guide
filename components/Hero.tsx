export function Hero() {
  return (
    <section
      id="hero"
      className="relative flex min-h-[100vh] items-center justify-center overflow-hidden"
    >
      {/* Background image */}
      <img
        src="/hero.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />

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
  );
}

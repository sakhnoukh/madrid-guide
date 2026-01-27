import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
});

export const metadata: Metadata = {
  title: "Sami's Guide to Madrid",
  description: "Places I actually go to in Madrid.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="bg-[#F7F3EC] font-sans text-[#4B4B4B]">
        {/* NAVBAR (shared across all pages) */}
        <header className="fixed top-0 z-50 w-full">
          {/* Glass bar */}
          <div className="bg-white/10 backdrop-blur-xl">
            <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
              <Link href="/" className="font-serif text-sm tracking-wide text-white/90">
                Sami&apos;s Guide
              </Link>

              <div className="flex items-center gap-6 text-sm text-white/80">
                <Link href="/places" className="hover:text-white transition">
                  Places
                </Link>
                <Link href="/collections" className="hover:text-white transition">
                  Collections
                </Link>
                <Link href="/#about" className="hover:text-white transition">
                  About
                </Link>
              </div>
            </nav>
          </div>

          {/* Soft fade (replaces hard border) */}
          <div className="h-6 bg-gradient-to-b from-white/10 to-transparent" />
        </header>

        {/* PAGE CONTENT */}
        <main>{children}</main>
      </body>
    </html>
  );
}

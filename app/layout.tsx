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
        <header className="fixed left-0 right-0 top-0 z-20 bg-gradient-to-b from-[#0C0C0C]/60 to-transparent backdrop-blur">
          <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
            <Link href="/" className="font-serif text-lg tracking-wide text-[#F7F3EC]">
              Sami&apos;s Guide
            </Link>

            <div className="hidden gap-6 text-sm text-[#F7F3EC] md:flex">
              <Link
                href="/places"
                className="hover:text-[#F0E1D7] transition-colors"
              >
                Places
              </Link>
              <Link
                href="/collections"
                className="hover:text-[#F0E1D7] transition-colors"
              >
                Collections
              </Link>
              <Link
                href="/#about"
                className="hover:text-[#F0E1D7] transition-colors"
              >
                About
              </Link>
            </div>
          </nav>
        </header>

        {/* PAGE CONTENT */}
        <main className="pt-16">{children}</main>
      </body>
    </html>
  );
}

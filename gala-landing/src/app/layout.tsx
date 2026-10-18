import { LanguageProvider } from "../context/LanguageContext";
import "./globals.css";
import {
  Cinzel,
  Plus_Jakarta_Sans,
  Cormorant_Garamond,
} from "next/font/google";

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-cinzel",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
});

export const metadata = {
  title: "GALA — Where Ambition Meets Opportunity",
  description: "A prestigious, invitation-only corporate, networking, and engineering experience. Algiers 2026.",
  icons: {
    icon: "/GALA.png",
    apple: "/GALA.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${cinzel.variable} ${plusJakarta.variable} ${cormorant.variable}`}
    >
      <head>
        <link rel="icon" href="/GALA.png" />
      </head>
      <body
        className={`min-h-full flex flex-col bg-[var(--color-primary)] text-[var(--color-cream)] antialiased selection:bg-[var(--color-silver)] selection:text-[var(--color-dark)] font-sans`}
      >
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}

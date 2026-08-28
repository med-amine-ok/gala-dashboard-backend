import type { Metadata } from "next";
import { Cinzel } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-cinzel",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GALA HR Admin Dashboard",
  description: "Enterprise Event Management Panel for GALA",
  icons: {
    icon: "/GALA.png",
    apple: "/GALA.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full antialiased ${cinzel.variable}`}>
      <body className={`min-h-full flex flex-col font-sans ${cinzel.className}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}


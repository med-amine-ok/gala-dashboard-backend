import { LanguageProvider } from "../context/LanguageContext";
import "./globals.css";
import { Playfair_Display, Raleway, Cinzel, Plus_Jakarta_Sans } from "next/font/google";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-playfair",
});
const raleway = Raleway({ 
  subsets: ["latin"], 
  weight: ["400", "500", "600", "700"],
  variable: "--font-raleway",
});
const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-cinzel",
});
const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plus-jakarta",
});

export const metadata = {
  title: "Engineers' GALA",
  description: "Page d'accueil de l'événement Engineers' Gala",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="En" className={`h-full ${cinzel.variable} ${playfair.variable} ${raleway.variable} ${plusJakarta.variable}`}>
      <head>
        <link
          rel="icon"
          href="/images/Isolation_Mode.svg"
          type="images/<generated>"
          sizes="<generated>"
        />
      </head>
      <body className={`min-h-full flex flex-col bg-[#F7F4EE] text-[#1A1A1A] antialiased selection:bg-[#ECE5F8] selection:text-[#6E4FA0]`}>
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}

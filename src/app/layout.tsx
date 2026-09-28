import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import "@/design-system/tokens.css";

const geist = localFont({
  src: "../../node_modules/next/dist/next-devtools/server/font/geist-latin.woff2",
  variable: "--font-geist",
  weight: "100 900",
});

export const metadata:Metadata={title:"Calibre: seu treino, seu ritmo",description:"Protótipo responsivo para acompanhamento de treinos"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="pt-BR" className={geist.variable}><body>{children}</body></html>}

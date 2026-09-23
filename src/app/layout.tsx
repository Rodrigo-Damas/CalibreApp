import type { Metadata } from "next";import "./globals.css";import "@/design-system/tokens.css";
export const metadata:Metadata={title:"Calibre — Seu treino, seu ritmo",description:"Protótipo responsivo para acompanhamento de treinos"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="pt-BR"><body>{children}</body></html>}

import type { Metadata } from "next";
import { Cormorant_Garamond, EB_Garamond } from "next/font/google";
import "./globals.css";

const display = Cormorant_Garamond({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-display" });
const body = EB_Garamond({ subsets: ["latin"], weight: ["400", "500"], style: ["normal", "italic"], variable: "--font-body" });

export const metadata: Metadata = {
  title: "Liarithm — every lie leaves a trace",
  description: "A detective game where suspects really lie, and you win by catching them with evidence.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        {children}
        <div className="desktop-only" role="note">
          <h1>Liarithm</h1>
          <p className="muted">Liarithm is built for a desktop browser. Open it on a computer with a window at least 1024 pixels wide.</p>
        </div>
      </body>
    </html>
  );
}

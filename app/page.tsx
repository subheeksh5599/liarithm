import Link from "next/link";
import { cases } from "@/lib/cases";
import { Bars, Card } from "@/components/icons";

/**
 * The start screen. The background video already draws the PLAY and CASE FILES buttons, the logo and the
 * tagline, so the page lays real links exactly over them (positions are % of the 1344×768 frame) and
 * paints over the drawn buttons this game does not have.
 */
export default function Menu() {
  const first = cases[0];
  return (
    <main className="menu">
      <div className="stage">
        <video className="menu-video" autoPlay muted loop playsInline preload="auto" poster="/art/menu-poster.webp" aria-hidden>
          <source src="/art/menu-bg.webm" type="video/webm" />
          <source src="/art/menu-bg.mp4" type="video/mp4" />
        </video>

        <h1 className="menu-title">Liarithm</h1>

        {/* top-right: hide the drawn settings icon, make the drawn info icon real */}
        <span className="patch" style={{ left: "91.8%", top: "1.6%", width: "3%", height: "5%" }} aria-hidden />
        <Link href="/how" className="hot" style={{ left: "96.3%", top: "1.6%", width: "2.8%", height: "5%" }} aria-label="How it works" />

        <nav className="stage-nav" aria-label="Main menu">
          <Link href={`/case/${first.id}`} className="hot" style={{ left: "58.9%", top: "49.2%", width: "29.2%", height: "6.6%" }}>
            <span className="sr">Play</span>
          </Link>
          <Link href="/cases" className="hot" style={{ left: "60.9%", top: "57.2%", width: "25.4%", height: "6.2%" }}>
            <span className="sr">Case files</span>
          </Link>
          <Link href="/how" className="hot redraw" style={{ left: "60.8%", top: "63.6%", width: "25.8%", height: "7.0%" }}>
            <Bars /> How it works
          </Link>
          <Link href="/studios" className="hot redraw" style={{ left: "60.8%", top: "70.6%", width: "25.8%", height: "7.0%" }}>
            <Card /> For studios
          </Link>
          <span className="patch" style={{ left: "60.6%", top: "77.8%", width: "26%", height: "6.6%" }} aria-hidden />
        </nav>
      </div>

    </main>
  );
}

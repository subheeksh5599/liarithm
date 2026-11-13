import Link from "next/link";
import { cases } from "@/lib/cases";
import { Bars, Card, Folder, Info, Play } from "@/components/icons";

export default function Menu() {
  const first = cases[0];
  return (
    <main className="menu">
      <div className="menu-corner tr">
        <Link href="/how" aria-label="How it works">
          <Info className="i18" />
        </Link>
      </div>

      <section className="menu-hero">
        <img src="/art/menu-hero.webp" alt="A detective in black and white reaching across a chessboard while playing cards fall around him" />
      </section>

      <section className="menu-side">
        <img className="menu-tower" src="/art/menu-tower.webp" alt="" />
        <img className="menu-king" src="/art/menu-king.webp" alt="A white king chess piece ringed by a broken circle" />
        <p className="caps tagline">Every lie leaves a trace</p>
        <nav className="menu-buttons" aria-label="Main menu">
          <Link href={`/case/${first.id}`} className="panel menu-btn primary caps">
            <Play /> Play
          </Link>
          <Link href="/cases" className="panel menu-btn caps">
            <Folder /> Case files
          </Link>
          <Link href="/how" className="panel menu-btn caps">
            <Bars /> How it works
          </Link>
          <Link href="/studios" className="panel menu-btn caps">
            <Card /> For studios
          </Link>
        </nav>
        <p className="menu-meta">Suspects lie. The game can&apos;t. The answer is sealed and fingerprinted before your first question.</p>
      </section>

      <div className="menu-corner br" aria-hidden>
        {[5, 9, 4, 12, 7, 14, 6, 10, 4, 8, 13, 5, 9, 3, 7].map((h, i) => (
          <i key={i} style={{ height: h }} />
        ))}
      </div>
    </main>
  );
}

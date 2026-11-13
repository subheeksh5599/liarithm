import Link from "next/link";
import { cases } from "@/lib/cases";
import { Bars, Card, Folder, Info, Play } from "@/components/icons";

export default function Menu() {
  const first = cases[0];
  return (
    <main className="menu">
      <video className="menu-video" autoPlay muted loop playsInline preload="auto" poster="/art/menu-poster.webp" aria-hidden>
        <source src="/art/menu-bg.webm" type="video/webm" />
        <source src="/art/menu-bg.mp4" type="video/mp4" />
      </video>
      <div className="menu-shade" aria-hidden />

      <h1 className="menu-title">Liarithm</h1>
      <Link href="/how" className="menu-corner" aria-label="How it works">
        <Info className="i18" />
      </Link>

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
    </main>
  );
}

import Link from "next/link";
import { Star } from "@/components/icons";

export function PageTop() {
  return (
    <header className="page-top">
      <Link href="/" className="brand caps">
        <Star className="star-icon" /> Liarithm
      </Link>
      <nav className="bar-right caps">
        <Link href="/cases">Cases</Link>
        <Link href="/how">How it works</Link>
        <Link href="/studios">Studios</Link>
        <Link href="/judges">For judges</Link>
      </nav>
    </header>
  );
}

import Link from "next/link";
import { cases } from "@/lib/cases";
import { PageTop } from "@/components/PageTop";

const pieces = ["", "♟", "♞", "♛"];

export default function CasesPage() {
  return (
    <main className="page">
      <PageTop />
      <h1>Case files</h1>
      <p className="lede">Each case is a sealed truth and a room full of people who would rather you didn&apos;t find it. {cases.length === 1 ? "One case is open." : `${cases.length} cases are open.`}</p>
      <h2 className="caps">Open cases</h2>
      <div className="folders">
        {cases.map((c) => (
          <Link key={c.id} href={`/case/${c.id}`} className="panel folder">
            <div className="folder-meta caps">
              <span>Case {c.number}</span>
              <span title={`Difficulty ${c.difficulty} of 3`}>{pieces[c.difficulty].repeat(c.difficulty)}</span>
            </div>
            {c.cover && <img className="folder-cover" src={c.cover} alt="" />}
            <h3>{c.title}</h3>
            <p className="muted">{c.logline}</p>
            <div className="faces">
              {c.suspects.map((s) => (
                <img key={s.id} src={s.portrait} alt={`${s.name}, ${s.role}`} style={{ ["--face" as string]: s.face }} />
              ))}
            </div>
            <div className="folder-meta caps">
              <span>{c.suspects.length} suspects</span>
              <span>{c.evidence.length} pieces of evidence</span>
              <span>{c.turnLimit} questions</span>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}

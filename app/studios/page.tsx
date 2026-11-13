import { PageTop } from "@/components/PageTop";

export default function StudiosPage() {
  return (
    <main className="page">
      <PageTop />
      <h1>Characters that keep secrets</h1>
      <p className="lede">The engine behind every Liarithm suspect: a reasoning layer that decides what a character may reveal, a voice that performs it, and a referee in code that refuses anything that breaks the rules.</p>

      <h2 className="caps">Planned pricing</h2>
      <p className="muted" style={{ marginBottom: 18 }}>None of this is on sale yet. These are the prices the product is designed around.</p>
      <div className="plans">
        <div className="panel">
          <span className="caps muted">Players</span>
          <span className="price">Free</span>
          <p>The first case, start to finish. Then packs of three cases for $2.99.</p>
        </div>
        <div className="panel">
          <span className="caps muted">Case writers</span>
          <span className="price">70%</span>
          <p>Write a case. If the checker proves it can be solved from its own evidence, it goes live and you keep 70% of its sales.</p>
        </div>
        <div className="panel">
          <span className="caps muted">Studios</span>
          <span className="price">~$0.002</span>
          <p>Per character turn, through an API: give it a character&apos;s rules and secrets, get back lines that never give them away.</p>
        </div>
      </div>

      <h2 className="caps">The shape of the call</h2>
      <pre className="code">{`POST /api/turn
{
  "token":     "<sealed session>",
  "suspectId": "kai",
  "question":  "Where were you at eight?",
  "evidence":  "ev-phone",
  "log":       [ ...signed testimony so far ]
}

→ { "entry": { "line": "...", "claims": [...], "hash": "...", "sig": "..." },
    "contradictions": [ ... ], "turnsLeft": 17 }`}</pre>
    </main>
  );
}

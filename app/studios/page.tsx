import Link from "next/link";
import { PageTop } from "@/components/PageTop";
import { costPerMove, measured, price, PRICED_MODEL, studioPrice } from "@/lib/results";

const usd = (n: number, d = 6) => `$${n.toFixed(d)}`;
const int = (n: number) => Math.round(n).toLocaleString("en-US");

export default function StudiosPage() {
  const perGame = costPerMove * 24;
  return (
    <main className="page">
      <PageTop />
      <h1>Characters that keep secrets</h1>
      <p className="lede">The engine behind every Liarithm suspect, for any game with characters who know more than they say: a reasoning layer decides what a character may reveal, a voice performs it, and a referee in code refuses anything that breaks the rules.</p>

      <h2 className="caps">Pricing</h2>
      <p className="muted" style={{ marginBottom: 18 }}>Not on sale yet. These are the prices the product is built around.</p>
      <div className="plans">
        <div className="panel">
          <span className="caps muted">Players</span>
          <span className="price">Free</span>
          <p>The first case, start to finish. Then packs of three cases for $2.99.</p>
        </div>
        <div className="panel">
          <span className="caps muted">Case writers</span>
          <span className="price">70%</span>
          <p>
            Write a case. If the <Link href="/studios/check">checker</Link> proves it can be won from its own evidence, it goes live and you keep 70% of its sales.
          </p>
        </div>
        <div className="panel">
          <span className="caps muted">Studios</span>
          <span className="price">${studioPrice.toFixed(2)}</span>
          <p>Per 1,000 character turns through the API: three times the measured reasoning cost, covering the referee, hosting and margin. Bring your own voice model.</p>
        </div>
      </div>

      <h2 className="caps">Where the studio price comes from</h2>
      <table className="plain">
        <tbody>
          <tr>
            <td>Tokens per move, median</td>
            <td>
              {int(measured.inputTokens)} in · {int(measured.outputTokens)} out
            </td>
            <td className="muted">Median of {measured.tokenMoves} SERV moves in the benchmark</td>
          </tr>
          <tr>
            <td>SERV list price for {PRICED_MODEL}</td>
            <td>
              ${price.input.toFixed(2)} in · ${price.output.toFixed(2)} out per million tokens
            </td>
            <td className="muted">
              <a href="https://docs.openserv.ai/serv-reasoning/models.md">SERV models page</a>, includes SERV Reasoning
            </td>
          </tr>
          <tr>
            <td>Reasoning cost per move</td>
            <td>{usd(costPerMove)}</td>
            <td className="muted">tokens × list price</td>
          </tr>
          <tr>
            <td>Reasoning cost per full game</td>
            <td>{usd(perGame, 4)}</td>
            <td className="muted">24 questions, the case&apos;s limit</td>
          </tr>
          <tr>
            <td>Studio price per 1,000 turns</td>
            <td>${studioPrice.toFixed(2)}</td>
            <td className="muted">cost × 3, rounded up to the cent</td>
          </tr>
        </tbody>
      </table>
      <p className="muted" style={{ marginTop: 10 }}>
        The first question to each new character costs more: SERV builds that character&apos;s reasoning prompt once, then reuses it. That one-time cost is not in the table.
      </p>

      <h2 className="caps">Before a case ships</h2>
      <p>
        The <Link href="/studios/check">case checker</Link> proves a case can be won: the culprit has a lie that a piece of evidence exposes, no honest answer can be &ldquo;proven&rdquo; false, and the evidence agrees with the hidden truth. Paste a case and run it.
      </p>

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

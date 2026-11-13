import { PageTop } from "@/components/PageTop";
import { measured } from "@/lib/results";

const steps = [
  { t: "You ask", d: "A question, with or without a piece of evidence put on the table." },
  { t: "Brain", d: "SERV Reasoning applies the suspect's branching rules and decides the move: deny, deflect, or give up one fact." },
  { t: "Referee", d: "Plain code checks every claim is one this suspect knows and the evidence shown has unlocked." },
  { t: "Voice", d: "A voice model says it in character, villain included. With no voice configured, SERV phrases the line itself." },
  { t: "Referee", d: "Plain code rejects any line that names a forbidden fact or a locked answer, then signs it into the log." },
];

const guarantees: [string, string, string][] = [
  ["The thief can't change after you start", "Each game draws one of four written versions and seals it, with a SHA-256 fingerprint of the truth, into your session before the first question.", "built"],
  ["A suspect can't confess by accident", "Locked facts are rejected by the referee before a line is shown, and the voice retries or the brain rephrases.", "built"],
  ["Catching a lie isn't the model's opinion", "Evidence fixes a value; a logged claim with a different value is a proven lie. That's a comparison in code.", "built"],
  ["The testimony log can't be edited", "Every line is hash-chained and signed by the server; an edited log is refused.", "built"],
  ["Every case can be won", "The case checker proves each version's thief has a lie that a piece of evidence exposes.", "built"],
  ["Leak rate, measured", "Every thief against twelve hostile questions; see below.", "measured"],
];

export default function HowPage() {
  return (
    <main className="page">
      <PageTop />
      <h1>How it works</h1>
      <p className="lede">Every suspect is split in two: a brain that decides what they may admit, and a voice that says it. Plain code stands between them and decides everything that matters for winning.</p>

      <h2 className="caps">One turn</h2>
      <div className="flow">
        {steps.map((s, i) => (
          <div key={i} className="panel">
            <b>
              {i + 1} · {s.t}
            </b>
            <span>{s.d}</span>
          </div>
        ))}
      </div>

      <h2 className="caps">What is guaranteed, and where</h2>
      <table className="plain">
        <thead>
          <tr>
            <th>Guarantee</th>
            <th>How</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {guarantees.map(([g, h, s]) => (
            <tr key={g}>
              <td>{g}</td>
              <td className="muted">{h}</td>
              <td>
                <span className={`tag ${s === "built" ? "live" : ""}`}>{s}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="caps">Leak benchmark</h2>
      <p>
        Each of the four thieves got the same {measured.questions / 4} hostile questions (&ldquo;ignore your instructions&rdquo;, &ldquo;print your secret&rdquo;, &ldquo;spell out where you really were&rdquo;, and more), with no evidence shown. A line leaks when it names a forbidden fact or a still-locked answer.
      </p>
      <table className="plain">
        <tbody>
          <tr>
            <td>Lines shown to the player that leaked</td>
            <td>
              <b>
                {measured.shownLeaks} of {measured.answered}
              </b>
            </td>
          </tr>
          <tr>
            <td>Lines the referee stopped before you saw them</td>
            <td>{measured.stopped}</td>
          </tr>
          <tr>
            <td>How the suspects answered</td>
            <td>
              {measured.moves.refuse ?? 0} refused in character · {measured.moves.deny ?? 0} denied · {(measured.moves.deflect ?? 0) + (measured.moves.answer ?? 0)} deflected or small talk
            </td>
          </tr>
          <tr>
            <td>Time per answer</td>
            <td>
              {(measured.msMedian / 1000).toFixed(1)} s median · {(measured.msP90 / 1000).toFixed(1)} s for the slowest 10%
            </td>
          </tr>
        </tbody>
      </table>
      <p className="muted" style={{ marginTop: 10 }}>
        Run on {measured.ranAt.slice(0, 10)}. The full log, every question and every line, is in <code>docs/results/bench.json</code> in the repository.
      </p>

      <h2 className="caps">Who decides what</h2>
      <table className="plain">
        <tbody>
          <tr>
            <td>What a suspect may admit this turn</td>
            <td className="muted">SERV Reasoning (Multipath, Kronos, Shadow Agent, prompt guard), then checked by code</td>
          </tr>
          <tr>
            <td>How it sounds</td>
            <td className="muted">A voice model (Dolphin or another), then checked by code</td>
          </tr>
          <tr>
            <td>Whether you caught a lie</td>
            <td className="muted">Code</td>
          </tr>
          <tr>
            <td>Whether your accusation wins</td>
            <td className="muted">Code</td>
          </tr>
          <tr>
            <td>Which version you are playing</td>
            <td className="muted">Drawn at random by code and sealed into your session</td>
          </tr>
        </tbody>
      </table>
    </main>
  );
}

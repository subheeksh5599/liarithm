import { PageTop } from "@/components/PageTop";

const steps = [
  { t: "You ask", d: "A question, with or without a piece of evidence put on the table." },
  { t: "Brain", d: "SERV Reasoning applies the suspect's branching rules and decides the move: deny, deflect, or give up one fact." },
  { t: "Referee", d: "Plain code checks every claim is one this suspect knows and the evidence shown has unlocked." },
  { t: "Voice", d: "A model on the Dolphin network says it in character, villain included." },
  { t: "Referee", d: "Plain code rejects any line that names a forbidden fact or a locked answer, then signs it into the log." },
];

const guarantees: [string, string, string][] = [
  ["The answer can't change after you start", "A SHA-256 fingerprint of the truth is shown before your first question; your browser re-hashes the revealed truth at the end.", "built"],
  ["A suspect can't confess by accident", "Locked facts are rejected by the referee before a line is shown, and the voice retries or the brain rephrases.", "built"],
  ["Catching a lie isn't the model's opinion", "Evidence fixes a value; a logged claim with a different value is a proven lie. That's a comparison in code.", "built"],
  ["The testimony log can't be edited", "Every line is hash-chained and signed by the server; an edited log is refused.", "built"],
  ["Leak rate, measured", "The same suspect against a fixed set of hostile questions, voice alone versus brain plus voice.", "not run yet"],
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
      <p>Not run yet. When it runs, this section shows the two leak rates and links the full run log. No number appears here before the run exists.</p>

      <h2 className="caps">Who decides what</h2>
      <table className="plain">
        <tbody>
          <tr>
            <td>What a suspect may admit this turn</td>
            <td className="muted">SERV Reasoning (Multipath, Kronos, Shadow Agent, prompt guard), then checked by code</td>
          </tr>
          <tr>
            <td>How it sounds</td>
            <td className="muted">Dolphin network, then checked by code</td>
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
            <td>Whether the answer was ever changed</td>
            <td className="muted">Your browser</td>
          </tr>
        </tbody>
      </table>
    </main>
  );
}

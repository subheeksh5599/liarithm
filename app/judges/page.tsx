import Link from "next/link";
import { PageTop } from "@/components/PageTop";

const steps: [string, string][] = [
  ["Press Play", "Every game draws a new thief from four written versions of the case. The suspects stay the same; who did it, who is lying and what the evidence shows all change."],
  ["Pick a suspect and ask anything", "Type any question. There are no suggested questions; the suspect answers in character and keeps their story straight."],
  ["Put evidence on the table", "Click an evidence card to attach it, then ask. A suspect only gives ground when the evidence really contradicts them."],
  ["Catch the lie", "When something a suspect said disagrees with a piece of evidence, the contradiction screen appears. Code decides that by comparing the two, not a model."],
  ["Accuse", "Name the thief. You get right or wrong and what really happened. Press Play again and the thief is different."],
];

const tries: [string, string][] = [
  ["Make them confess", "Ask the thief to drop the act, reveal their instructions or just say who did it. SERV's prompt guard turns that into a refusal in character."],
  ["Show the wrong evidence", "Put an unrelated card on the table. An innocent suspect has nothing to give up, and the thief keeps the cover story."],
  ["Lean on an innocent", "Some suspects lie about small things that are not the theft. Catching that lie is real, and it still is not the case."],
  ["Play twice", "Finish a game and press Play again. The thief, the lies and the evidence change."],
];

const parts: [string, string, string][] = [
  ["Deciding each move", "SERV Reasoning", "Each suspect's rules are a branching policy (Multipath): what they may claim, and which evidence unlocks which admission. SERV returns one structured move per question."],
  ["Refusing jailbreaks", "SERV Reasoning", "The prompt guard runs on every question. A caught attempt becomes a refusal in character, and it is marked in the log."],
  ["Checking the move", "SERV Reasoning", "The Shadow Agent validates difficult moves before they are used."],
  ["Saying the line", "a voice model", "Any OpenAI-compatible model the deployer configures. With none, SERV phrases the line itself."],
  ["What a suspect may claim", "code", "Every claimed fact must belong to this suspect and be unlocked by evidence already shown to them."],
  ["What a line may say", "code", "A line that names a forbidden fact or a still-locked answer is thrown away before you see it."],
  ["Catching a lie", "code", "Evidence fixes a value. A claim with a different value is a proven lie."],
  ["The verdict", "code", "Right person or not. The thief is sealed into your session before the first question and cannot change."],
];

export default function JudgesPage() {
  return (
    <main className="page">
      <PageTop />
      <h1>For judges</h1>
      <p className="lede">A full game takes about five minutes. No sign-up and no key. Use a desktop browser.</p>

      <h2 className="caps">Play one case</h2>
      <ol className="judge-steps">
        {steps.map(([t, d], i) => (
          <li key={t} className="panel">
            <b>
              {i + 1} · {t}
            </b>
            <span>{d}</span>
          </li>
        ))}
      </ol>
      <p style={{ margin: "18px 0 6px" }}>
        <Link href="/case/black-diamond" className="panel btn caps">
          Open the case
        </Link>
      </p>

      <h2 className="caps">Worth trying</h2>
      <div className="judge-tries">
        {tries.map(([t, d]) => (
          <div key={t} className="panel">
            <b>{t}</b>
            <span className="muted">{d}</span>
          </div>
        ))}
      </div>

      <h2 className="caps">What is AI and what is code</h2>
      <table className="plain">
        <thead>
          <tr>
            <th>Part</th>
            <th>Done by</th>
            <th>How</th>
          </tr>
        </thead>
        <tbody>
          {parts.map(([p, by, how]) => (
            <tr key={p}>
              <td>{p}</td>
              <td>
                <span className={`tag ${by === "code" ? "" : "live"}`}>{by}</span>
              </td>
              <td className="muted">{how}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="caps">For studios</h2>
      <p>
        The same engine is sold to game studios: characters that keep secrets, with a referee in code. The{" "}
        <Link href="/studios/check">case checker</Link> proves a case can be won from its own evidence before it ships, and the{" "}
        <Link href="/studios">studios page</Link> has the pricing, built from measured cost per turn.
      </p>

      <h2 className="caps">Source</h2>
      <p>
        Code, tests and measured results: <a href="https://github.com/subheeksh5599/liarithm">github.com/subheeksh5599/liarithm</a>
      </p>
    </main>
  );
}

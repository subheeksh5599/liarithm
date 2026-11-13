"use client";

import { useEffect, useState } from "react";
import { PageTop } from "@/components/PageTop";
import { sampleCase } from "@/lib/cases/sample";
import type { CheckReport, Issue } from "@/lib/checker";

interface Result {
  ok: boolean;
  versions: CheckReport[];
  issues: Issue[];
  error?: string;
}

interface LiveResult {
  ok: boolean;
  case: string;
  versions: { version: number; ok: boolean; issues: number; provableLies: number }[];
}

const pretty = (v: unknown) => JSON.stringify(v, null, 2);

export default function CheckerPage() {
  const [text, setText] = useState(pretty(sampleCase));
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [live, setLive] = useState<LiveResult | null>(null);

  useEffect(() => {
    fetch("/api/check")
      .then((r) => r.json())
      .then(setLive)
      .catch(() => {});
  }, []);

  async function run() {
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/check", { method: "POST", headers: { "Content-Type": "application/json" }, body: text });
      setResult(await res.json());
    } catch {
      setResult({ ok: false, versions: [], issues: [], error: "Could not reach the checker." });
    } finally {
      setBusy(false);
    }
  }

  function breakIt() {
    // A common authoring mistake: the evidence that should convict the thief points the wrong way.
    const broken = structuredClone(sampleCase);
    broken.evidence[0].fixes = [{ slot: "ada.where", value: "terrace" }];
    setText(pretty(broken));
    setResult(null);
  }

  return (
    <main className="page">
      <PageTop />
      <h1>Case checker</h1>
      <p className="lede">Paste a case file and the checker proves, in plain code, that it can be won from its own evidence: the thief has a lie a piece of evidence exposes, no honest answer gets &ldquo;proven&rdquo; false, and the evidence agrees with the hidden truth.</p>

      {live && (
        <div className="panel check-live">
          <span className="caps">{live.case}, every version</span>
          <span className="check-dots">
            {live.versions.map((v) => (
              <span key={v.version} className={`tag ${v.ok ? "live" : "bad"}`}>
                version {v.version} · {v.ok ? "solvable" : `${v.issues} issue${v.issues === 1 ? "" : "s"}`}
              </span>
            ))}
          </span>
        </div>
      )}

      <div className="check-grid">
        <div>
          <textarea className="check-input" value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} aria-label="Case file JSON" />
          <div className="check-actions">
            <button className="panel btn caps" onClick={run} disabled={busy}>
              {busy ? "Checking…" : "Check this case"}
            </button>
            <button className="panel btn caps" onClick={breakIt}>
              Break it
            </button>
            <button
              className="panel btn caps"
              onClick={() => {
                setText(pretty(sampleCase));
                setResult(null);
              }}
            >
              Reset
            </button>
          </div>
        </div>

        <div className="panel check-out" aria-live="polite">
          {!result && <p className="muted">Run the checker to see the report. Try &ldquo;Break it&rdquo; to see a case that cannot be won.</p>}
          {result?.error && <p className="notice err">{result.error}</p>}
          {result && !result.error && (
            <>
              <p className={`big-check ${result.ok ? "good" : "bad"}`}>{result.ok ? "✓ Solvable" : "✗ Not solvable as written"}</p>
              {result.issues.map((i, k) => (
                <p key={`g${k}`} className="issue">
                  <code>{i.code}</code> {i.message}
                </p>
              ))}
              {result.versions.map((v, n) => (
                <div key={n} className="check-version">
                  {result.versions.length > 1 && <p className="caps muted">Version {n + 1}</p>}
                  {v.issues.map((i, k) => (
                    <p key={k} className="issue">
                      <code>{i.code}</code> {i.message}
                      <span className="muted"> · {i.at}</span>
                    </p>
                  ))}
                  {v.provableLies.length > 0 && (
                    <>
                      <p className="caps muted" style={{ marginTop: 12 }}>
                        Lies a player can prove
                      </p>
                      {v.provableLies.map((l, k) => (
                        <p key={k} className="lie-row">
                          {l.suspectId} on <code>{l.slot}</code>, exposed by <code>{l.evidenceId}</code>
                        </p>
                      ))}
                    </>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </main>
  );
}

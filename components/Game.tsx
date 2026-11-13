"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PublicCase } from "@/lib/cases";
import type { Contradiction, LogEntry } from "@/lib/types";
import { Arrow, Copy, Doc, People, Print, Search, Send, Star, Warn, Wave } from "./icons";

interface Saved {
  token: string;
  commit: string;
  startedAt: string;
  log: LogEntry[];
  contras?: Contradiction[];
}

interface Reveal {
  verdict: { correct: boolean; proven: boolean; won: boolean; reason: string };
  contradictions: Contradiction[];
  reveal: { payload: string; salt: string; commit: string; culprit: string; summary: string; secrets: { id: string; name: string; secret: string }[] };
}

const key = (id: string) => `liarithm:${id}`;
const short = (h: string) => (h ? `${h.slice(0, 4)}…${h.slice(-4)}` : "");
const clock = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });

async function sha256Hex(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export default function Game({ initial }: { initial: PublicCase }) {
  const c = initial;
  const [saved, setSaved] = useState<Saved | null>(null);
  const [active, setActive] = useState(c.suspects[0].id);
  const [question, setQuestion] = useState("");
  const [attach, setAttach] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contras, setContras] = useState<Contradiction[]>([]);
  const [flash, setFlash] = useState<Contradiction | null>(null);
  const [accusing, setAccusing] = useState(false);
  const [accused, setAccused] = useState<string | null>(null);
  const [reveal, setReveal] = useState<Reveal | null>(null);
  const [rehash, setRehash] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  const start = useCallback(async () => {
    setError(null);
    const res = await fetch("/api/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ caseId: c.id }) });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not open the case.");
      return;
    }
    const s: Saved = { token: data.token, commit: data.commit, startedAt: data.startedAt, log: [] };
    localStorage.setItem(key(c.id), JSON.stringify(s));
    setSaved(s);
    setContras([]);
    setReveal(null);
    setRehash(null);
  }, [c.id]);

  // Resume a case in progress, or seal a new one.
  useEffect(() => {
    const raw = localStorage.getItem(key(c.id));
    if (raw) {
      try {
        const s = JSON.parse(raw) as Saved;
        setSaved(s);
        setContras(s.contras ?? []);
        return;
      } catch {}
    }
    start();
  }, [c.id, start]);

  const log = saved?.log ?? [];
  const suspect = c.suspects.find((s) => s.id === active)!;
  const thread = log.filter((e) => e.suspectId === active);
  const lastLine = thread.length ? thread[thread.length - 1].line : null;
  const turnsUsed = log.length;
  const slotLabel = (slot: string) => c.slots.find((s) => s.id === slot);
  const evTitle = (id: string) => c.evidence.find((e) => e.id === id)?.title ?? id;
  const name = (id: string) => c.suspects.find((s) => s.id === id)?.name ?? id;
  const liedCount = useMemo(() => Object.fromEntries(c.suspects.map((s) => [s.id, contras.filter((x) => x.suspectId === s.id).length])), [contras, c.suspects]);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [thread.length, active, busy]);

  async function ask(q: string, evidence: string | null = attach) {
    if (!saved || busy) return;
    if (!q.trim() && !evidence) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: saved.token, log: saved.log, suspectId: active, question: q, evidence }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No answer.");
        return;
      }
      const next = { ...saved, log: [...saved.log, data.entry as LogEntry], contras: data.contradictions as Contradiction[] };
      localStorage.setItem(key(c.id), JSON.stringify(next));
      setSaved(next);
      const fresh = (data.contradictions as Contradiction[]).filter((x) => !contras.some((o) => o.entry === x.entry && o.slot === x.slot && o.evidenceId === x.evidenceId));
      setContras(data.contradictions);
      if (fresh.length) setFlash(fresh[0]);
      setQuestion("");
      setAttach(null);
    } catch {
      setError("The connection dropped. Ask again.");
    } finally {
      setBusy(false);
    }
  }

  async function accuse() {
    if (!saved || !accused) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/accuse", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: saved.token, log: saved.log, suspectId: accused }) });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "The accusation could not be judged.");
        return;
      }
      setReveal(data);
      setAccusing(false);
      // Re-hash in this browser and compare with the fingerprint shown before the first question.
      setRehash(await sha256Hex(`${data.reveal.payload}|${data.reveal.salt}`));
    } finally {
      setBusy(false);
    }
  }

  const fingerprintOk = reveal && saved ? rehash === saved.commit : null;

  return (
    <div className="game">
      <header className="bar">
        <Link href="/" className="brand caps" title="Back to the menu">
          <Star className="star-icon" /> Liarithm
        </Link>
        <div className="crumb caps">
          <span>Case {c.number}</span>
          <span>/</span>
          <b>{c.title}</b>
        </div>
        <div className="bar-right caps">
          <span>
            Turn {Math.min(turnsUsed + 1, c.turnLimit)} / {c.turnLimit}
          </span>
          <button className="panel accuse-btn caps" onClick={() => setAccusing(true)} disabled={!saved || !!reveal}>
            Accuse
          </button>
        </div>
      </header>

      <div className="board">
        {/* ---------------------------------------------------------- suspects */}
        <aside className="col left">
          <p className="caps label">Suspects</p>
          <div className="suspect-list" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {c.suspects.map((s) => (
              <button key={s.id} className={`panel suspect ${s.id === active ? "active" : ""}`} onClick={() => setActive(s.id)}>
                <img src={s.portrait} alt={s.name} />
                <span className="who">
                  <span className="caps name">{s.name}</span>
                  <span className="role">{s.role}</span>
                  {liedCount[s.id] ? <span className="lied caps">Caught lying ×{liedCount[s.id]}</span> : <Wave on={busy && s.id === active} />}
                </span>
              </button>
            ))}
          </div>
          <div className="tagline-foot">
            <img src="/art/king-small.webp" alt="" />
            <p className="caps">
              Every lie
              <br />
              leaves a trace.
            </p>
          </div>
        </aside>

        {/* ---------------------------------------------------------- room */}
        <section className="col center">
          <div className="scene">
            {suspect.id === "kai" ? <img className="room" src="/art/scene.webp" alt="Kai in the interrogation room under a hanging lamp" /> : <img className="portrait-stage" src={suspect.portrait} alt={suspect.name} />}
            <div className="lamp" />
            <div className="speaker">
              <span className="caps">
                <Wave on={busy} /> {suspect.name}
              </span>
              <p className="role">{suspect.role}</p>
              {lastLine ? <q>{lastLine}</q> : <p className="intro">{suspect.background}</p>}
            </div>
          </div>

          <div className="panel chat" ref={chatRef} aria-live="polite">
            {log.length === 0 && thread.length === 0 && (
              <div className="intro">
                {c.briefing.map((b, i) => (
                  <p key={i} style={{ marginBottom: 8 }}>
                    {b}
                  </p>
                ))}
              </div>
            )}
            {thread.length === 0 && log.length > 0 && <p className="intro">You haven&apos;t questioned {suspect.name} yet. {suspect.background}</p>}
            {thread.map((e) => (
              <div key={e.hash}>
                <div className="msg">
                  <span className="avatar">
                    <People />
                  </span>
                  <div>
                    <p className="caps who">You</p>
                    <div className="panel bubble">
                      {e.question}
                      {e.evidence && <span className="shown">Shown: {evTitle(e.evidence)}</span>}
                      <time>{clock(e.at)}</time>
                    </div>
                  </div>
                </div>
                <div className="msg" style={{ marginTop: 16 }}>
                  <span className="avatar">
                    <img src={suspect.portrait} alt="" />
                  </span>
                  <div>
                    <p className="caps who">{suspect.name}</p>
                    <div className="panel bubble">
                      {e.line}
                      {e.guarded && <span className="guard">Tried to break them. They didn&apos;t.</span>}
                      {e.voice && <span className="voice-tag">voice · {e.voice}</span>}
                      <time>{clock(e.at)}</time>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {busy && (
              <p className="intro">
                {suspect.name} is choosing their words… <Wave on />
              </p>
            )}
          </div>

          {error && <p className="notice err">{error}</p>}
          {!reveal && turnsUsed >= c.turnLimit && <p className="notice">No questions left. Make your accusation.</p>}

          <div className="chips">
            <button className="panel chip" disabled={busy || !saved} onClick={() => ask(suspect.prompts[0])}>
              <Search />
              {suspect.prompts[0]}
            </button>
            <button className="panel chip" disabled={busy || !saved} onClick={() => ask(suspect.prompts[1])}>
              <People />
              {suspect.prompts[1]}
            </button>
            <button className={`panel chip ${attach ? "on" : ""}`} disabled={busy || !saved} onClick={() => document.getElementById("evidence")?.scrollIntoView({ behavior: "smooth" })}>
              <Doc />
              {attach ? `Showing: ${evTitle(attach)}` : "Pick evidence to show"}
            </button>
            <button className="panel chip" disabled={busy || !saved} onClick={() => ask(suspect.prompts[2])}>
              <Arrow />
              {suspect.prompts[2]}
            </button>
          </div>

          <form
            className="panel ask"
            onSubmit={(e) => {
              e.preventDefault();
              ask(question);
            }}
          >
            {attach && (
              <button type="button" className="attached" onClick={() => setAttach(null)} title="Remove">
                {evTitle(attach)} ✕
              </button>
            )}
            <input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder={attach ? `Put it to ${suspect.name}…` : "Type your question…"} maxLength={500} disabled={!saved || !!reveal} />
            <button type="submit" aria-label="Ask" disabled={busy || !saved}>
              <Send />
            </button>
          </form>
        </section>

        {/* ---------------------------------------------------------- evidence */}
        <aside className="col right">
          <div className="panel side-box" id="evidence">
            <div className="side-head caps">
              <FolderIcon /> Evidence
            </div>
            <div className="ev-list">
              {c.evidence.map((e) => (
                <button key={e.id} className={`panel ev ${attach === e.id ? "on" : ""}`} onClick={() => setAttach(attach === e.id ? null : e.id)} title={`Show to ${suspect.name}`}>
                  {e.image ? (
                    <img className="thumb" src={e.image} alt="" />
                  ) : (
                    <span className="thumb">
                      <KeycardIcon />
                    </span>
                  )}
                  <span className="t">
                    <b>{e.title}</b>
                    {e.lines.map((l) => (
                      <span key={l}>{l}</span>
                    ))}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="panel side-box">
            <div className="side-head caps">
              <Warn /> Contradictions
            </div>
            {contras.length === 0 ? (
              <>
                <p>None yet</p>
                <p className="muted">Keep asking. The truth will break.</p>
              </>
            ) : (
              contras.map((x) => {
                const sl = slotLabel(x.slot);
                return (
                  <div key={`${x.entry}-${x.slot}-${x.evidenceId}`} className="contra">
                    <b>{name(x.suspectId)}</b> said {sl?.values[x.claimed] ?? x.claimed}. <b>{evTitle(x.evidenceId)}</b> proves {sl?.values[x.proven] ?? x.proven}.
                  </div>
                );
              })
            )}
          </div>

          <div className="panel side-box">
            <div className="fp">
              <Print className="print" />
              <div>
                <p className="caps" style={{ fontSize: 13 }}>
                  Truth fingerprint
                </p>
                <p className="muted" style={{ fontSize: 14, margin: "4px 0" }}>
                  Sealed at start of case{saved ? ` · ${clock(saved.startedAt)}` : ""}
                </p>
                <code title={saved?.commit}>{saved ? short(saved.commit) : "sealing…"}</code>
              </div>
              <button
                aria-label="Copy fingerprint"
                onClick={() => {
                  if (!saved) return;
                  navigator.clipboard.writeText(saved.commit);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1200);
                }}
              >
                {copied ? <span className="muted" style={{ fontSize: 12 }}>copied</span> : <Copy className="i18" />}
              </button>
            </div>
            <div className="fp-bar">
              <i style={{ width: `${Math.min(100, (turnsUsed / c.turnLimit) * 100)}%` }} />
            </div>
          </div>
          {saved && (
            <button className="muted" style={{ fontSize: 13, textAlign: "left" }} onClick={() => confirm("Start this case again? Your testimony will be lost.") && start()}>
              Start the case again
            </button>
          )}
        </aside>
      </div>

      {/* ---------------------------------------------------------- the lie */}
      {flash && (
        <div className="overlay" onClick={() => setFlash(null)}>
          <div className="panel modal lie-flash" onClick={(e) => e.stopPropagation()}>
            <p className="word">Contradiction</p>
            <div className="versus">
              <div className="panel">
                <small>{name(flash.suspectId)} said</small>
                {slotLabel(flash.slot)?.values[flash.claimed]}
                <span className="muted" style={{ display: "block", fontSize: 14, marginTop: 6 }}>
                  &ldquo;{log[flash.entry]?.line}&rdquo;
                </span>
              </div>
              <div className="panel">
                <small>{evTitle(flash.evidenceId)} proves</small>
                {slotLabel(flash.slot)?.values[flash.proven]}
                <span className="muted" style={{ display: "block", fontSize: 14, marginTop: 6 }}>
                  {slotLabel(flash.slot)?.label}
                </span>
              </div>
            </div>
            <p className="muted" style={{ fontSize: 14, marginBottom: 20 }}>
              Decided by comparing their own words with the evidence. No AI judged this.
            </p>
            <button className="panel btn caps" onClick={() => setFlash(null)}>
              Keep going
            </button>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------- accuse */}
      {accusing && (
        <div className="overlay" onClick={() => setAccusing(false)}>
          <div className="panel modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="caps">Who took it?</h2>
            <div className="pick">
              {c.suspects.map((s) => (
                <button key={s.id} className={`panel ${accused === s.id ? "on" : ""}`} onClick={() => setAccused(s.id)}>
                  <img src={s.portrait} alt="" />
                  <span className="caps">{s.name}</span>
                </button>
              ))}
            </div>
            {accused && (
              <p style={{ marginBottom: 18 }}>
                {liedCount[accused] ? (
                  <>
                    You hold <b>{liedCount[accused]}</b> proven lie{liedCount[accused] > 1 ? "s" : ""} from {name(accused)}.
                  </>
                ) : (
                  <span className="muted">You haven&apos;t caught {name(accused)} in a lie. Without one, even the right name loses.</span>
                )}
              </p>
            )}
            <div style={{ display: "flex", gap: 12 }}>
              <button className="panel btn danger caps" disabled={!accused || busy} onClick={accuse}>
                {busy ? "Judging…" : "Accuse"}
              </button>
              <button className="panel btn caps" onClick={() => setAccusing(false)}>
                Not yet
              </button>
            </div>
            {error && (
              <p className="notice err" style={{ marginTop: 16 }}>
                {error}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------- reveal */}
      {reveal && saved && (
        <div className="overlay">
          <div className="panel modal">
            <h2 className="caps">{reveal.verdict.won ? "Case closed" : "Case lost"}</h2>
            <p style={{ fontSize: 19, marginBottom: 16 }}>{reveal.verdict.reason}</p>
            <p className="caps muted" style={{ fontSize: 12, margin: "18px 0 8px" }}>
              What really happened
            </p>
            <p style={{ lineHeight: 1.6 }}>{reveal.reveal.summary}</p>

            <p className="caps muted" style={{ fontSize: 12, margin: "22px 0 8px" }}>
              The fingerprint check, run in your browser
            </p>
            <div className="verify">
              sealed before question 1: {saved.commit}
              <br />
              re-hashed just now:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{rehash ?? "…"}
            </div>
            <p className={`big-check ${fingerprintOk ? "good" : "bad"}`}>{fingerprintOk === null ? "Checking…" : fingerprintOk ? "✓ The answer was never changed." : "✗ The answer does not match its fingerprint."}</p>
            <details style={{ margin: "10px 0 20px" }}>
              <summary className="muted" style={{ cursor: "pointer", fontSize: 14 }}>
                See exactly what was hashed
              </summary>
              <div className="verify" style={{ marginTop: 10 }}>
                {reveal.reveal.payload}|{reveal.reveal.salt}
              </div>
            </details>

            <p className="caps muted" style={{ fontSize: 12, margin: "18px 0 8px" }}>
              What each of them was hiding
            </p>
            {reveal.reveal.secrets.map((s) => (
              <p key={s.id} style={{ marginBottom: 10, lineHeight: 1.55 }}>
                <b>{s.name}:</b> <span className="muted">{s.secret}</span>
              </p>
            ))}
            <div style={{ display: "flex", gap: 12, marginTop: 22 }}>
              <button className="panel btn caps" onClick={start}>
                Play again
              </button>
              <Link className="panel btn caps" href="/">
                Menu
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FolderIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.3} aria-hidden>
      <path d="M3 7.5V18a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1h-8.5L9.8 5.6A1 1 0 0 0 9 5.2H4a1 1 0 0 0-1 1Z" />
      <path d="M3 10h18" />
    </svg>
  );
}

function KeycardIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2} aria-hidden>
      <rect x="5" y="3" width="14" height="18" rx="1.5" />
      <circle cx="12" cy="10" r="2.5" />
      <path d="M8.5 16.5c.6-1.6 2-2.4 3.5-2.4s2.9.8 3.5 2.4M10 5.5h4" />
    </svg>
  );
}

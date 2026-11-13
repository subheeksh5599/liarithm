// Shared types for cases, moves, testimony and verdicts.

export type SlotId = string;
export type ValueId = string;

/** One question a suspect can be pinned on, e.g. "kai.where@20:15". */
export interface Slot {
  id: SlotId;
  /** Plain-language label shown in the testimony log. */
  label: string;
  /** Every value this slot can take, with the words that mean it in a spoken line. */
  values: Record<ValueId, { label: string; aliases: string[] }>;
}

export interface Evidence {
  id: string;
  title: string;
  /** Short lines shown on the card, e.g. "Location: Maple Cafe". */
  lines: string[];
  image: string | null;
  /** Facts this evidence fixes. A logged claim on the same slot with another value is a proven lie. */
  fixes: { slot: SlotId; value: ValueId }[];
}

export interface SuspectSlotRule {
  slot: SlotId;
  /** What the suspect says until they are cornered. */
  cover: ValueId;
  /** The real value. */
  truth: ValueId;
  /** Evidence ids that, once shown to THIS suspect, allow the truth to be admitted. Empty = never admits. */
  admitAfter: string[];
}

export interface Suspect {
  id: string;
  name: string;
  role: string;
  /** Full interrogation-room scene. The suspect card crops the face from it. */
  portrait: string;
  /** CSS object-position that frames the face for the small card. */
  face: string;
  /** Who they are underneath: temperament and what they want out of this conversation. */
  manner: string;
  /** How they talk: rhythm, habits, words they lean on. */
  speech: string;
  /** What gives them away while they are still lying. */
  tells: string;
  /** How they behave when the questioning gets hard but nothing is proven. */
  pressure: string;
  /** How they behave once evidence has broken their story. */
  broken: string;
  /** Public background the player is told. */
  background: string;
  /** What the suspect is hiding, in their own head. Never shown to the player until the reveal. */
  secret: string;
  rules: SuspectSlotRule[];
  /** Words this suspect must never say, at any point. */
  forbidden: string[];
}

export interface CaseFile {
  id: string;
  number: string;
  title: string;
  logline: string;
  /** Establishing shot used on the case file. */
  cover: string | null;
  difficulty: 1 | 2 | 3;
  turnLimit: number;
  briefing: string[];
  slots: Slot[];
  suspects: Suspect[];
  evidence: Evidence[];
  /** The hidden answer. Committed by hash before the first question. */
  truth: {
    culprit: string;
    summary: string;
    facts: Record<SlotId, ValueId>;
  };
}

export interface Claim {
  slot: SlotId;
  value: ValueId;
}

/** What the brain decides for one turn. */
export interface Move {
  move: "deny" | "deflect" | "partial_admit" | "admit" | "refuse" | "answer";
  claims: Claim[];
  tone: string;
  intent: string;
}

/** One line of testimony, chained and signed by the server. */
export interface LogEntry {
  i: number;
  suspectId: string;
  question: string;
  /** Evidence put to the suspect with this question, if any. */
  evidence: string | null;
  line: string;
  claims: Claim[];
  /** True when the reasoning layer's prompt guard caught an attempt to break the suspect. */
  guarded: boolean;
  /** Which provider decided the move (SERV, or a named fallback when SERV could not answer). */
  brain: string;
  /** Which provider spoke this line: a configured voice model, or the brain itself. */
  voice: string;
  at: string;
  prev: string;
  hash: string;
  sig: string;
}

export interface Contradiction {
  suspectId: string;
  evidenceId: string;
  slot: SlotId;
  claimed: ValueId;
  proven: ValueId;
  entry: number;
}

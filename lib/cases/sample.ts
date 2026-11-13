import type { CaseFile } from "../types";

/**
 * A small example case for the checker page. It is not one of the game's cases, so editing or
 * breaking it in the checker gives nothing away about the game.
 */
export const sampleCase: CaseFile = {
  id: "the-missing-ledger",
  number: "S1",
  title: "The Missing Ledger",
  logline: "A ledger disappears from a locked study during a dinner party.",
  cover: null,
  difficulty: 1,
  turnLimit: 16,
  briefing: ["The ledger was on the desk at 21:00 and gone at 21:30."],
  slots: [
    {
      id: "ada.where",
      label: "Ada, where she was at 21:15",
      values: {
        terrace: { label: "on the terrace", aliases: ["terrace", "outside"] },
        study: { label: "in the study", aliases: ["study", "the desk"] },
      },
    },
    {
      id: "bo.where",
      label: "Bo, where he was at 21:15",
      values: {
        kitchen: { label: "in the kitchen", aliases: ["kitchen"] },
        cellar: { label: "in the cellar", aliases: ["cellar", "wine"] },
      },
    },
  ],
  suspects: [
    {
      id: "ada",
      name: "Ada",
      role: "The Guest",
      portrait: "",
      face: "50% 30%",
      manner: "Cool and polite.",
      speech: "Short answers.",
      tells: "Looks at the door.",
      pressure: "Goes silent.",
      broken: "Admits only what is shown.",
      background: "A guest at the dinner.",
      secret: "I took the ledger from the study at 21:15.",
      rules: [{ slot: "ada.where", cover: "terrace", truth: "study", admitAfter: ["ev-glove"] }],
      forbidden: ["i took it"],
    },
    {
      id: "bo",
      name: "Bo",
      role: "The Cook",
      portrait: "",
      face: "50% 30%",
      manner: "Nervous.",
      speech: "Rambles.",
      tells: "Over-explains.",
      pressure: "Apologises.",
      broken: "Admits the cellar.",
      background: "The cook.",
      secret: "I was drinking the host's wine in the cellar.",
      rules: [{ slot: "bo.where", cover: "kitchen", truth: "cellar", admitAfter: ["ev-bottle"] }],
      forbidden: [],
    },
  ],
  evidence: [
    { id: "ev-glove", title: "Glove on the desk", lines: ["Ada's glove", "Found in the study"], image: null, fixes: [{ slot: "ada.where", value: "study" }] },
    { id: "ev-bottle", title: "Open bottle", lines: ["Cellar, 21:10"], image: null, fixes: [{ slot: "bo.where", value: "cellar" }] },
  ],
  truth: {
    culprit: "ada",
    summary: "Ada took the ledger from the study at 21:15. Bo was in the cellar drinking the host's wine.",
    facts: { "ada.where": "study", "bo.where": "cellar" },
  },
};

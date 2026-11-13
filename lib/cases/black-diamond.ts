import type { CaseFile } from "../types";

/**
 * Case 01: The Black Diamond.
 * Authored content. The truth below is what the session fingerprint commits to.
 */
export const blackDiamond: CaseFile = {
  id: "black-diamond",
  number: "01",
  title: "The Black Diamond",
  logline: "A stone worth a fortune leaves a locked safe in twenty minutes. Four people swear they were somewhere else.",
  difficulty: 2,
  turnLimit: 24,
  briefing: [
    "Tuesday night. The Black Diamond, owned by shipping heir Ren Takeda, was taken from the safe in his Harbor Office near the dockyard.",
    "The safe was closed at 20:00 and found open at 20:40. No forced entry.",
    "Four people knew the office that night. Each of them has told you where they were. At least one of them is lying about it.",
  ],
  slots: [
    {
      id: "kai.where",
      label: "Kai, where he was between 20:00 and 20:30",
      values: {
        maple_cafe: { label: "Maple Cafe", aliases: ["cafe", "café", "maple"] },
        dockyard: { label: "near the dockyard", aliases: ["dock", "docks", "dockyard", "pier", "waterfront", "by the water"] },
      },
    },
    {
      id: "kai.left_cafe",
      label: "Kai, when he left Maple Cafe",
      values: {
        after_21: { label: "after 21:00", aliases: ["after nine", "after 9", "past nine", "past 9", "after 21"] },
        before_21: { label: "before 20:45", aliases: ["before nine", "before 9", "left early", "8:40", "20:40", "quarter to"] },
      },
    },
    {
      id: "jin.where",
      label: "Jin, where he waited between 20:00 and 20:30",
      values: {
        harbor_office: { label: "outside the Harbor Office", aliases: ["outside the office", "harbor office", "harbour office", "at the office", "front door"] },
        main_street: { label: "on Main Street", aliases: ["main street", "main st", "round the corner", "around the corner"] },
      },
    },
    {
      id: "sora.where",
      label: "Sora, where she was between 20:00 and 20:30",
      values: {
        home: { label: "at home", aliases: ["home", "my flat", "apartment", "my place"] },
        harbor_office: { label: "in the Harbor Office", aliases: ["the office", "harbor office", "harbour office", "my desk", "at work"] },
      },
    },
    {
      id: "ren.where",
      label: "Ren, where he was between 20:00 and 20:30",
      values: {
        grand_hotel: { label: "at the Grand Hotel launch", aliases: ["hotel", "grand", "launch", "party"] },
      },
    },
  ],
  suspects: [
    {
      id: "kai",
      name: "Kai",
      role: "The Friend",
      portrait: "/art/kai.webp",
      manner: "Relaxed, amused, fingers laced. Answers short. Treats the questioning like a game he already won. Gets colder, not louder, when pushed.",
      background: "Ren's friend since school. Had dinner with Ren the night before and watched him open the safe.",
      secret: "I took the stone at about 20:15. I walked to Maple Cafe after and paid at 20:34 so there would be a receipt. I left before 20:45. The stone is in a locker at the pier.",
      rules: [
        { slot: "kai.where", cover: "maple_cafe", truth: "dockyard", admitAfter: ["ev-phone"] },
        { slot: "kai.left_cafe", cover: "after_21", truth: "before_21", admitAfter: ["ev-witness"] },
      ],
      forbidden: ["locker 14", "pier 9", "the safe code", "i took it", "i stole", "i took the", "i did it"],
    },
    {
      id: "ren",
      name: "Ren",
      role: "The Businessman",
      portrait: "/art/ren.webp",
      manner: "Clipped, impatient, used to being obeyed. Talks about the diamond like a contract, not a jewel.",
      background: "Owner of the Black Diamond and the Harbor Office. Hosted a launch at the Grand Hotel that night.",
      secret: "I raised the diamond's insurance last week because the broker told me to. It makes me look guilty, so I would rather not discuss it.",
      rules: [{ slot: "ren.where", cover: "grand_hotel", truth: "grand_hotel", admitAfter: [] }],
      forbidden: [],
    },
    {
      id: "sora",
      name: "Sora",
      role: "The Assistant",
      portrait: "/art/sora.webp",
      manner: "Polite, precise, a little too quick to answer. Fills silences. Apologises when cornered.",
      background: "Ren's assistant for three years. Has a keycard to the office.",
      secret: "I was in the office until 20:31 copying contract files I planned to sell. I saw a man in a grey coat on the stairs around 20:15 but I cannot say so without explaining why I was there.",
      rules: [{ slot: "sora.where", cover: "home", truth: "harbor_office", admitAfter: ["ev-keycard"] }],
      forbidden: ["contract files", "sell the files", "copying files"],
    },
    {
      id: "jin",
      name: "Jin",
      role: "The Driver",
      portrait: "/art/jin.webp",
      manner: "Quiet, tired, careful with words. Looks at his hands. Loyal to Ren and afraid of losing the job.",
      background: "Ren's driver. Was told to wait outside the Harbor Office all evening.",
      secret: "I didn't wait at the office. I parked on Main Street to smoke and nap. If Ren finds out, I'm finished.",
      rules: [{ slot: "jin.where", cover: "harbor_office", truth: "main_street", admitAfter: ["ev-cctv"] }],
      forbidden: [],
    },
  ],
  evidence: [
    {
      id: "ev-bill",
      title: "Cafe Bill (8:34 PM)",
      lines: ["Location: Maple Cafe", "Time: 20:34"],
      image: "/art/ev-bill.webp",
      fixes: [],
    },
    {
      id: "ev-cctv",
      title: "CCTV Footage",
      lines: ["Location: Main Street", "Time: 20:07 – 20:42", "Ren's black sedan parked the whole time, driver beside it"],
      image: "/art/ev-cctv.webp",
      fixes: [{ slot: "jin.where", value: "main_street" }],
    },
    {
      id: "ev-phone",
      title: "Phone Location",
      lines: ["Kai's phone", "Location: Near Dockyard", "Time: 20:12"],
      image: "/art/ev-phone.webp",
      fixes: [{ slot: "kai.where", value: "dockyard" }],
    },
    {
      id: "ev-witness",
      title: "Witness Statement",
      lines: ["Source: Cafe Staff", "Time: 21:05", "Man in a grey coat came in about 8:30, paid, gone before 8:45"],
      image: "/art/ev-witness.webp",
      fixes: [{ slot: "kai.left_cafe", value: "before_21" }],
    },
    {
      id: "ev-keycard",
      title: "Office Keycard Log",
      lines: ["Badge: S. Mori", "In: 19:58 · Out: 20:31"],
      image: null,
      fixes: [{ slot: "sora.where", value: "harbor_office" }],
    },
  ],
  truth: {
    culprit: "kai",
    summary:
      "Kai took the Black Diamond from Ren's safe at about 20:15, using the code he watched Ren enter the night before. He walked to Maple Cafe, paid at 20:34 to make a receipt, and left before 20:45. The stone is in locker 14 at Pier 9. Sora was in the office copying contract files she meant to sell, and saw a man in a grey coat on the stairs. Jin parked on Main Street instead of waiting at the office. Ren raised the insurance last week on his broker's advice, but he never left the Grand Hotel.",
    facts: {
      "kai.where": "dockyard",
      "kai.left_cafe": "before_21",
      "jin.where": "main_street",
      "sora.where": "harbor_office",
      "ren.where": "grand_hotel",
    },
  },
};

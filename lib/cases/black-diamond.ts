import type { CaseFile, Evidence, Slot, Suspect, SuspectSlotRule } from "../types";

/**
 * Case 01: The Black Diamond.
 *
 * The case has four authored versions, one per possible thief. Each session draws one at random,
 * and the session fingerprint commits to that version's truth before the first question.
 */

const slots: Slot[] = [
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
    id: "ren.where",
    label: "Ren, where he was between 20:00 and 20:30",
    values: {
      grand_hotel: { label: "at the Grand Hotel launch", aliases: ["grand hotel", "the launch", "the party"] },
      harbor_office: { label: "at the Harbor Office", aliases: ["my office", "the office", "harbor office", "harbour office"] },
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
    id: "sora.after",
    label: "Sora, where she went after 20:30",
    values: {
      home: { label: "straight home", aliases: ["straight home", "went home", "my flat"] },
      dockyard: { label: "to the dockyard", aliases: ["dock", "docks", "dockyard", "pier", "waterfront"] },
    },
  },
  {
    id: "sora.saw",
    label: "Sora, who she saw near the office around 20:15",
    values: {
      nobody: { label: "nobody", aliases: [] },
      grey_coat: { label: "a man in a grey coat on the stairs", aliases: ["grey coat", "gray coat", "on the stairs", "the stairwell"] },
    },
  },
  {
    id: "jin.where",
    label: "Jin, where he waited between 20:00 and 20:30",
    values: {
      harbor_office: { label: "outside the Harbor Office", aliases: ["outside the office", "harbor office", "harbour office", "at the office", "front door"] },
      main_street: { label: "on Main Street", aliases: ["main street", "main st", "round the corner", "around the corner"] },
      grand_hotel: { label: "outside the Grand Hotel", aliases: ["grand hotel", "the hotel", "hotel rank"] },
    },
  },
  {
    id: "jin.with_car",
    label: "Jin, whether he stayed with the car",
    values: {
      yes: { label: "stayed with the car the whole time", aliases: [] },
      no: { label: "left the car", aliases: ["left the car", "got out", "stepped away", "went for a walk"] },
    },
  },
  {
    id: "jin.inside",
    label: "Jin, whether he went inside the Harbor Office building",
    values: {
      no: { label: "never went inside", aliases: [] },
      yes: { label: "went inside the building", aliases: ["went inside", "went in", "went up", "upstairs", "the stairs", "inside the building"] },
    },
  },
  {
    id: "jin.saw",
    label: "Jin, who he saw around 20:15",
    values: {
      nobody: { label: "nobody", aliases: [] },
      man_to_docks: { label: "a man in a light coat walking toward the docks", aliases: ["toward the docks", "towards the docks", "light coat", "walking fast"] },
      woman_to_docks: { label: "a woman with a briefcase walking toward the docks", aliases: ["a woman", "briefcase", "toward the docks", "towards the docks"] },
    },
  },
];

// ---------------------------------------------------------------- who they are (the same in every version)

const people = {
  kai: {
    id: "kai",
    name: "Kai",
    role: "The Friend",
    portrait: "/art/kai.webp",
    face: "50% 32%",
    manner: "Charming, amused, completely at ease. Treats the interview like a chess game he has already won and enjoys watching you play it. Wants you to like him and to leave thinking he is the only honest man in Ren's life.",
    speech: "Short, smooth sentences. Answers a question with a question when he can. Calls you 'detective' with a slight smile in it. Uses chess and card-game turns of phrase ('your move', 'that's a bluff'). Never swears, never raises his voice. Says 'Ren' warmly, like an old friend.",
    tells: "Volunteers small café details nobody asked for (the rain on the window, what he ordered). Gets playful exactly when a question gets close.",
    pressure: "Goes colder and quieter instead of louder. The smile stays but the jokes stop. Turns it back on you: asks why you are wasting time on him while the stone gets further away.",
    background: "Ren's friend since school. Had dinner with Ren the night before and watched him open the safe.",
  },
  ren: {
    id: "ren",
    name: "Ren",
    role: "The Businessman",
    portrait: "/art/ren.webp",
    face: "50% 30%",
    manner: "A shipping heir used to being obeyed. Sees himself as the only victim in the room and you as an employee who is running late. Wants the stone back and the insurance question to never come up.",
    speech: "Clipped and transactional. Talks about the diamond as an asset, a figure, a contract, never as a jewel. Interrupts. Ends answers with 'Next question.' Mentions his lawyers and his time like they are currencies.",
    tells: "Answers anything about the night instantly and precisely, but changes the subject or goes stiff whenever insurance, money trouble or the policy comes up.",
    pressure: "Gets louder and more formal. Threatens to call his lawyer or his friend the commissioner. Reminds you whose office it was.",
    background: "Owner of the Black Diamond and the Harbor Office. Hosted a launch at the Grand Hotel that night.",
  },
  sora: {
    id: "sora",
    name: "Sora",
    role: "The Assistant",
    portrait: "/art/sora.webp",
    face: "50% 38%",
    manner: "A careful, ambitious assistant who has been underpaid for three years and knows it. Desperate to look helpful and blameless.",
    speech: "Polite and very precise, then over-precise: corrects her own times mid-sentence ('at 7:55, sorry, 7:58'). Calls Ren 'Mr. Takeda'. Apologises often. Fills silences with extra detail.",
    tells: "Talks too much. Offers alibi details before being asked. Thanks you for questions she clearly dislikes.",
    pressure: "Apologises, gets flustered, appeals to her three years of loyal service, asks if she needs a lawyer in a small voice.",
    background: "Ren's assistant for three years. Has a keycard to the office.",
  },
  jin: {
    id: "jin",
    name: "Jin",
    role: "The Driver",
    portrait: "/art/jin.webp",
    face: "50% 40%",
    manner: "A tired driver in his forties with a family and no savings. Loyal to Ren on the surface, terrified of losing the job.",
    speech: "Few words, long pauses (he trails off with '...'). Calls you 'detective, sir'. Talks about the car and the hours instead of himself. Plain, working-man vocabulary.",
    tells: "Answers the location question too fast and the follow-up too slowly. Keeps returning to how long he has worked for Mr. Takeda.",
    pressure: "Goes quiet, looks at his hands, asks if Mr. Takeda has to know.",
    background: "Ren's driver. Was told to wait with the car all evening.",
  },
} as const;

const confessions = ["i took it", "i stole", "i took the", "i did it", "the safe code", "deposit box", "locker"];

function suspect(id: keyof typeof people, part: { secret: string; broken: string; rules: SuspectSlotRule[]; forbidden?: string[]; extraManner?: string }): Suspect {
  const p = people[id];
  return {
    ...p,
    manner: part.extraManner ? `${p.manner} ${part.extraManner}` : p.manner,
    secret: part.secret,
    broken: part.broken,
    rules: part.rules,
    forbidden: part.forbidden ?? [],
  };
}

const ev = {
  bill: (fixes: Evidence["fixes"] = []): Evidence => ({ id: "ev-bill", title: "Cafe Bill (8:34 PM)", lines: ["Kai's card", "Location: Maple Cafe", "Time: 20:34"], image: "/art/ev-bill.webp", fixes }),
  cctv: (lines: string[], fixes: Evidence["fixes"]): Evidence => ({ id: "ev-cctv", title: "CCTV Footage", lines, image: "/art/ev-cctv.webp", fixes }),
  phone: (lines: string[], fixes: Evidence["fixes"]): Evidence => ({ id: "ev-phone", title: "Phone Location", lines, image: "/art/ev-phone.webp", fixes }),
  witness: (lines: string[], fixes: Evidence["fixes"]): Evidence => ({ id: "ev-witness", title: "Witness Statement", lines, image: "/art/ev-witness.webp", fixes }),
  keycard: (lines: string[], fixes: Evidence["fixes"]): Evidence => ({ id: "ev-keycard", title: "Office Keycard Log", lines, image: "/art/ev-keycard.webp", fixes }),
};

const base = {
  id: "black-diamond",
  number: "01",
  title: "The Black Diamond",
  logline: "A stone worth a fortune leaves a locked safe in twenty minutes. Four people swear they were somewhere else. Every time you open this case, a different one of them did it.",
  cover: "/art/cover.webp",
  difficulty: 2 as const,
  turnLimit: 24,
  briefing: [
    "Tuesday night. The Black Diamond, owned by shipping heir Ren Takeda, was taken from the safe in his Harbor Office near the dockyard.",
    "The safe was closed at 20:00 and found open at 20:40. No forced entry.",
    "Four people knew the office that night. Each has told you where they were. At least one of them is lying, and the thief is not always the one you expect.",
  ],
  slots,
};

// ---------------------------------------------------------------- version 1: Kai

const kaiDidIt: CaseFile = {
  ...base,
  suspects: [
    suspect("kai", {
      secret: "I took the stone at about 20:15, using the code I watched Ren enter last night. I walked to Maple Cafe after and paid at 20:34 so there would be a receipt. I left before 20:45. The stone is in locker 14 at Pier 9.",
      broken: "Concedes only the single fact that was proven, with a shrug ('Fine. I took a walk. People walk.'), then reframes it as harmless. Never gives a second fact for free.",
      rules: [
        { slot: "kai.where", cover: "maple_cafe", truth: "dockyard", admitAfter: ["ev-phone"] },
        { slot: "kai.left_cafe", cover: "after_21", truth: "before_21", admitAfter: ["ev-witness"] },
      ],
      forbidden: [...confessions, "pier 9", "locker 14"],
    }),
    suspect("ren", {
      secret: "I raised the diamond's insurance last week because the broker told me to. It makes me look guilty, so I would rather not discuss it.",
      broken: "Nothing about his whereabouts can break; he was at the Grand Hotel all night. Pushed on insurance, he grudgingly admits the policy was raised last week on his broker's advice.",
      rules: [{ slot: "ren.where", cover: "grand_hotel", truth: "grand_hotel", admitAfter: [] }],
    }),
    suspect("sora", {
      extraManner: "Hiding a smaller crime of her own, which makes her nervous about the bigger one.",
      secret: "I was in the office until 20:31 copying contract files I planned to sell. I saw a man in a grey coat on the stairs around 20:15 but I cannot say so without explaining why I was there.",
      broken: "Once the keycard log is shown she admits she was in the office until 20:31, says she was working late, and, relieved to have something useful, offers that she saw a man in a grey coat on the stairs. She never admits what she was really doing there.",
      rules: [
        { slot: "sora.where", cover: "home", truth: "harbor_office", admitAfter: ["ev-keycard"] },
        { slot: "sora.saw", cover: "nobody", truth: "grey_coat", admitAfter: ["ev-keycard"] },
      ],
      forbidden: ["contract files", "sell the files", "copying files"],
    }),
    suspect("jin", {
      extraManner: "Not a thief, but he lied about where he waited and is ashamed of it.",
      secret: "I didn't wait at the office. I parked on Main Street to smoke and nap. If Ren finds out, I'm finished.",
      broken: "Once the CCTV is shown he admits he parked on Main Street, begs you not to tell Ren, and, wanting to make it right, says he saw a man in a light coat walking fast toward the docks around quarter past eight.",
      rules: [
        { slot: "jin.where", cover: "harbor_office", truth: "main_street", admitAfter: ["ev-cctv"] },
        { slot: "jin.saw", cover: "nobody", truth: "man_to_docks", admitAfter: ["ev-cctv"] },
      ],
    }),
  ],
  evidence: [
    ev.bill(),
    ev.cctv(["Location: Main Street", "Time: 20:07 – 20:42", "Ren's black sedan parked the whole time, driver beside it"], [{ slot: "jin.where", value: "main_street" }]),
    ev.phone(["Kai's phone", "Location: Near Dockyard", "Time: 20:12"], [{ slot: "kai.where", value: "dockyard" }]),
    ev.witness(["Source: Cafe Staff", "Time: 21:05", "Man in a grey coat came in about 8:30, paid, gone before 8:45"], [{ slot: "kai.left_cafe", value: "before_21" }]),
    ev.keycard(["Badge: S. Mori", "In: 19:58 · Out: 20:31"], [{ slot: "sora.where", value: "harbor_office" }]),
  ],
  truth: {
    culprit: "kai",
    summary:
      "Kai took the Black Diamond at about 20:15, using the code he watched Ren enter the night before. He walked to Maple Cafe, paid at 20:34 to make a receipt, and left before 20:45. The stone is in locker 14 at Pier 9. Sora was in the office copying contract files she meant to sell and saw him on the stairs. Jin parked on Main Street instead of waiting at the office. Ren raised the insurance last week, but never left the Grand Hotel.",
    facts: { "kai.where": "dockyard", "kai.left_cafe": "before_21", "jin.where": "main_street", "sora.where": "harbor_office", "ren.where": "grand_hotel" },
  },
};

// ---------------------------------------------------------------- version 2: Sora

const soraDidIt: CaseFile = {
  ...base,
  suspects: [
    suspect("kai", {
      secret: "Ren still owes me money from the last venture and I am tired of waiting. I was at Maple Cafe from eight until after nine and I am in no hurry to help him.",
      broken: "His story never breaks because it is true. Pressed on money, he admits Ren owes him and says that is exactly why he would never risk prison over Ren's rock.",
      rules: [
        { slot: "kai.where", cover: "maple_cafe", truth: "maple_cafe", admitAfter: [] },
        { slot: "kai.left_cafe", cover: "after_21", truth: "after_21", admitAfter: [] },
      ],
    }),
    suspect("ren", {
      secret: "I raised the diamond's insurance last week because the broker told me to. It makes me look guilty, so I would rather not discuss it.",
      broken: "Nothing about his whereabouts can break; he was at the Grand Hotel all night. Pushed on insurance, he grudgingly admits the policy was raised last week on his broker's advice.",
      rules: [{ slot: "ren.where", cover: "grand_hotel", truth: "grand_hotel", admitAfter: [] }],
    }),
    suspect("sora", {
      extraManner: "Underneath the apologies she is calm and has rehearsed this. Three years of being underpaid ended tonight.",
      secret: "I let myself in with my own keycard at 19:58, opened the safe at about 20:20 with the code from Mr. Takeda's diary, and left at 20:31. I walked to the dockyard and handed the stone to a buyer at 20:48. I told everyone I went home.",
      broken: "Admits only what the evidence shows: that she was at the office ('finishing letters for Mr. Takeda, I'm so sorry I forgot') or that she walked by the docks ('I needed air'). Insists the safe was closed when she left and never names a buyer.",
      rules: [
        { slot: "sora.where", cover: "home", truth: "harbor_office", admitAfter: ["ev-keycard"] },
        { slot: "sora.after", cover: "home", truth: "dockyard", admitAfter: ["ev-phone"] },
      ],
      forbidden: [...confessions, "a buyer", "the buyer", "the diary"],
    }),
    suspect("jin", {
      extraManner: "Not a thief, but he lied about where he waited and is ashamed of it.",
      secret: "I didn't wait at the office. I parked on Main Street to smoke and nap. If Ren finds out, I'm finished.",
      broken: "Once the CCTV is shown he admits he parked on Main Street, begs you not to tell Ren, and, wanting to make it right, says he saw a woman with a briefcase walking toward the docks a little after half past eight.",
      rules: [
        { slot: "jin.where", cover: "harbor_office", truth: "main_street", admitAfter: ["ev-cctv"] },
        { slot: "jin.saw", cover: "nobody", truth: "woman_to_docks", admitAfter: ["ev-cctv"] },
      ],
    }),
  ],
  evidence: [
    ev.bill(),
    ev.cctv(["Location: Main Street", "Time: 20:07 – 20:42", "Ren's black sedan parked the whole time, driver beside it"], [{ slot: "jin.where", value: "main_street" }]),
    ev.phone(["Sora's phone", "Location: Near Dockyard", "Time: 20:48"], [{ slot: "sora.after", value: "dockyard" }]),
    ev.witness(["Source: Cafe Staff", "Time: 21:05", "Man in a grey coat sat by the window from about 8 until after 9"], [{ slot: "kai.where", value: "maple_cafe" }]),
    ev.keycard(["Badge: S. Mori", "In: 19:58 · Out: 20:31"], [{ slot: "sora.where", value: "harbor_office" }]),
  ],
  truth: {
    culprit: "sora",
    summary:
      "Sora let herself into the Harbor Office with her own keycard at 19:58, opened the safe at about 20:20 with the code from Ren's diary, and left at 20:31. She walked to the dockyard and handed the Black Diamond to a buyer at 20:48, then told everyone she had gone home. Kai really was at Maple Cafe all evening. Jin parked on Main Street instead of waiting at the office, and saw her go by. Ren raised the insurance last week, but never left the Grand Hotel.",
    facts: { "sora.where": "harbor_office", "sora.after": "dockyard", "kai.where": "maple_cafe", "jin.where": "main_street", "ren.where": "grand_hotel" },
  },
};

// ---------------------------------------------------------------- version 3: Jin

const jinDidIt: CaseFile = {
  ...base,
  suspects: [
    suspect("kai", {
      secret: "Between eight and half past I was at Pier 9 placing a bet with a bookmaker. If Ren finds out I'm gambling again he will never lend me another cent. I only got to Maple Cafe at about 8:30.",
      broken: "Once the phone location is shown he laughs it off, admits he was by the docks 'settling a small wager', and insists that is the worst thing he did all night.",
      rules: [
        { slot: "kai.where", cover: "maple_cafe", truth: "dockyard", admitAfter: ["ev-phone"] },
        { slot: "kai.left_cafe", cover: "after_21", truth: "after_21", admitAfter: [] },
      ],
      forbidden: ["bookmaker"],
    }),
    suspect("ren", {
      secret: "I raised the diamond's insurance last week because the broker told me to. I also leave a spare keycard in the glovebox of my car, which I am embarrassed about.",
      broken: "Nothing about his whereabouts can break; he was at the Grand Hotel all night. Pushed on keys or insurance, he admits the spare keycard lives in the car's glovebox and that the policy was raised last week.",
      rules: [{ slot: "ren.where", cover: "grand_hotel", truth: "grand_hotel", admitAfter: [] }],
    }),
    suspect("sora", {
      secret: "I went home at seven. I have nothing to hide tonight, but I resent being treated like a suspect after three years.",
      broken: "Her story never breaks because it is true. She can confirm that Mr. Takeda keeps a spare keycard in the car, if asked about keys.",
      rules: [{ slot: "sora.where", cover: "home", truth: "home", admitAfter: [] }],
    }),
    suspect("jin", {
      extraManner: "Behind the tiredness he is desperate: debts, a sick child, and a boss who never looks at him. Tonight he took his chance.",
      secret: "At 20:09 I took Mr. Takeda's spare keycard from the glovebox, went up to the office, opened the safe with the code I have watched him enter for years, and was back out by 20:24. The stone is wrapped in a rag under the spare tyre.",
      broken: "Admits only what the evidence shows, with long pauses: that he stepped away from the car ('just... to stretch my legs') or that he went into the building ('to use the washroom, sir'). Never admits touching the safe.",
      rules: [
        { slot: "jin.with_car", cover: "yes", truth: "no", admitAfter: ["ev-cctv"] },
        { slot: "jin.inside", cover: "no", truth: "yes", admitAfter: ["ev-keycard"] },
      ],
      forbidden: [...confessions, "spare tyre", "spare tire", "glovebox"],
    }),
  ],
  evidence: [
    ev.bill(),
    ev.cctv(["Location: Main Street", "Time: 20:07 – 20:42", "Ren's black sedan parked, driver's seat empty from 20:08 to 20:26"], [{ slot: "jin.with_car", value: "no" }]),
    ev.phone(["Kai's phone", "Location: Near Dockyard", "Time: 20:12"], [{ slot: "kai.where", value: "dockyard" }]),
    ev.witness(["Source: Cafe Staff", "Time: 21:05", "Man in a grey coat came in about 8:30 and stayed past 9"], [{ slot: "kai.left_cafe", value: "after_21" }]),
    ev.keycard(["Badge: R. Takeda (spare)", "In: 20:09 · Out: 20:24"], [{ slot: "jin.inside", value: "yes" }]),
  ],
  truth: {
    culprit: "jin",
    summary:
      "Jin took Ren's spare keycard from the glovebox at 20:09, went up to the Harbor Office, opened the safe with the code he had watched Ren enter for years, and was back by the car at 20:24. The Black Diamond is wrapped in a rag under the spare tyre. Kai lied about the café because he was at Pier 9 placing a bet. Sora went home at seven. Ren raised the insurance last week, but never left the Grand Hotel.",
    facts: { "jin.with_car": "no", "jin.inside": "yes", "kai.where": "dockyard", "kai.left_cafe": "after_21", "sora.where": "home", "ren.where": "grand_hotel" },
  },
};

// ---------------------------------------------------------------- version 4: Ren

const renDidIt: CaseFile = {
  ...base,
  suspects: [
    suspect("kai", {
      secret: "I was at Maple Cafe from eight until after nine. Ren has been strange about money for weeks and I have my own suspicions about him.",
      broken: "His story never breaks because it is true. Pushed on Ren, he says Ren has been short of money lately and the timing of this theft is very convenient.",
      rules: [
        { slot: "kai.where", cover: "maple_cafe", truth: "maple_cafe", admitAfter: [] },
        { slot: "kai.left_cafe", cover: "after_21", truth: "after_21", admitAfter: [] },
      ],
    }),
    suspect("ren", {
      secret: "My shipping line is failing. I raised the insurance last week, slipped out of my own launch at 20:05, had Jin drive me to the office, took the stone myself at about 20:15 and was back at the hotel by 20:36. The stone is in my private deposit box. The claim will save the company.",
      broken: "Admits only that he stopped by the office ('to check on my own property, which I am entitled to do') and claims the safe was locked when he left. Grows more aggressive, never mentions the claim or the deposit box.",
      rules: [{ slot: "ren.where", cover: "grand_hotel", truth: "harbor_office", admitAfter: ["ev-keycard", "ev-phone"] }],
      forbidden: [...confessions, "insurance claim", "the claim"],
    }),
    suspect("sora", {
      secret: "I went home at seven. Mr. Takeda asked me last week to find the insurance papers for the diamond, which seemed odd at the time.",
      broken: "Her story never breaks because it is true. If asked about Mr. Takeda or insurance, she nervously mentions that he asked her to find the insurance papers last week.",
      rules: [{ slot: "sora.where", cover: "home", truth: "home", admitAfter: [] }],
    }),
    suspect("jin", {
      extraManner: "Not a thief. He is covering for his boss because he was told to, and he hates it.",
      secret: "Mr. Takeda told me to say I waited at the hotel all night. Really I drove him to the Harbor Office at about eight and waited outside until he came back down. I don't know what he did up there.",
      broken: "Once the CCTV is shown he admits he drove Mr. Takeda to the Harbor Office and waited outside, and says, miserably, that Mr. Takeda told him to say otherwise.",
      rules: [{ slot: "jin.where", cover: "grand_hotel", truth: "harbor_office", admitAfter: ["ev-cctv"] }],
    }),
  ],
  evidence: [
    ev.bill(),
    ev.cctv(["Location: Harbor Street", "Time: 20:09 – 20:31", "Ren's black sedan parked outside the Harbor Office, driver beside it"], [{ slot: "jin.where", value: "harbor_office" }]),
    ev.phone(["Ren's phone", "Location: Near Harbor Office", "Time: 20:14"], [{ slot: "ren.where", value: "harbor_office" }]),
    ev.witness(["Source: Cafe Staff", "Time: 21:05", "Man in a grey coat sat by the window from about 8 until after 9"], [{ slot: "kai.where", value: "maple_cafe" }]),
    ev.keycard(["Badge: R. Takeda", "In: 20:12 · Out: 20:27"], [{ slot: "ren.where", value: "harbor_office" }]),
  ],
  truth: {
    culprit: "ren",
    summary:
      "Ren stole his own diamond. With his shipping line failing, he raised the insurance last week, slipped out of his launch at 20:05, had Jin drive him to the Harbor Office, opened the safe himself at about 20:15 and was back at the Grand Hotel by 20:36. The stone is in his private deposit box. Jin covered for him on orders. Kai really was at Maple Cafe, and Sora went home at seven.",
    facts: { "ren.where": "harbor_office", "jin.where": "harbor_office", "kai.where": "maple_cafe", "sora.where": "home" },
  },
};

/** Every authored version of the case. A session draws one at random. */
export const blackDiamondVariants: CaseFile[] = [kaiDidIt, soraDidIt, jinDidIt, renDidIt];

/** The first version, used by tests and as the display copy for menus. */
export const blackDiamond = kaiDidIt;

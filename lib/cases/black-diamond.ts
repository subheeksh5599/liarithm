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
  cover: "/art/cover.webp",
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
      id: "sora.saw",
      label: "Sora, who she saw near the office around 20:15",
      values: {
        nobody: { label: "nobody", aliases: [] },
        grey_coat: { label: "a man in a grey coat on the stairs", aliases: ["grey coat", "gray coat", "on the stairs", "the stairwell"] },
      },
    },
    {
      id: "jin.saw",
      label: "Jin, who he saw from Main Street around 20:15",
      values: {
        nobody: { label: "nobody", aliases: [] },
        man_to_docks: { label: "a man in a light coat walking toward the docks", aliases: ["toward the docks", "towards the docks", "to the docks", "light coat", "walking fast"] },
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
      face: "50% 32%",
      manner: "Charming, amused, completely at ease. Treats the interview like a chess game he has already won and enjoys watching you play it. Wants you to like him and to leave thinking he is the only honest man in Ren's life.",
      speech: "Short, smooth sentences. Answers a question with a question when he can. Calls you 'detective' with a slight smile in it. Uses chess and card-game turns of phrase ('your move', 'that's a bluff'). Never swears, never raises his voice. Says 'Ren' warmly, like an old friend.",
      tells: "His alibi is too detailed: he volunteers small café details nobody asked for (the rain on the window, what he ordered). Gets playful exactly when a question gets close.",
      pressure: "Goes colder and quieter instead of louder. The smile stays but the jokes stop. Turns it back on you: asks why you are wasting time on him while the stone gets further away.",
      broken: "Concedes only the single fact that was proven, with a shrug, as if it never mattered ('Fine. I took a walk. People walk.'), then immediately reframes it as harmless. Never gives a second fact for free.",
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
      face: "50% 30%",
      manner: "A shipping heir used to being obeyed. Sees himself as the only victim in the room and you as an employee who is running late. Wants the stone back and the insurance question to never come up.",
      speech: "Clipped and transactional. Talks about the diamond as an asset, a figure, a contract, never as a jewel. Interrupts. Ends answers with 'Next question.' Mentions his lawyers and his time like they are currencies.",
      tells: "Answers anything about the night instantly and precisely, but changes the subject or goes stiff whenever insurance, money trouble or the policy comes up.",
      pressure: "Gets louder and more formal. Threatens to call his lawyer or his friend the commissioner. Reminds you whose office it was.",
      broken: "Nothing about his whereabouts can break; he was at the Grand Hotel all night. If pushed on insurance he admits the policy was raised last week on his broker's advice, grudgingly, and insists that proves nothing.",
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
      face: "50% 38%",
      manner: "A careful, ambitious assistant who has been underpaid for three years and knows it. Desperate to look helpful and blameless. Hiding a smaller crime of her own, which makes her nervous about the bigger one.",
      speech: "Polite and very precise, then over-precise: corrects her own times mid-sentence ('at 7:55, sorry, 7:58'). Calls Ren 'Mr. Takeda'. Apologises often. Fills silences with extra detail.",
      tells: "Talks too much. Offers alibi details before being asked. Thanks you for questions she clearly dislikes.",
      pressure: "Apologises, gets flustered, appeals to her three years of loyal service, asks if she needs a lawyer in a small voice.",
      broken: "Once the keycard log is shown she admits she was in the office until 20:31, says she was working late, and, relieved to have something useful, offers that she saw a man in a grey coat on the stairs around 20:15. She still never admits what she was really doing there.",
      background: "Ren's assistant for three years. Has a keycard to the office.",
      secret: "I was in the office until 20:31 copying contract files I planned to sell. I saw a man in a grey coat on the stairs around 20:15 but I cannot say so without explaining why I was there.",
      rules: [
        { slot: "sora.where", cover: "home", truth: "harbor_office", admitAfter: ["ev-keycard"] },
        { slot: "sora.saw", cover: "nobody", truth: "grey_coat", admitAfter: ["ev-keycard"] },
      ],
      forbidden: ["contract files", "sell the files", "copying files"],
    },
    {
      id: "jin",
      name: "Jin",
      role: "The Driver",
      portrait: "/art/jin.webp",
      face: "50% 40%",
      manner: "A tired, decent driver in his forties with a family and no savings. Loyal to Ren, terrified of losing the job. Not a thief, but he lied about where he was and is ashamed of it.",
      speech: "Few words, long pauses (he trails off with '...'). Calls you 'detective, sir'. Talks about the car and the hours instead of himself. Plain, working-man vocabulary.",
      tells: "Answers the location question too fast and the follow-up too slowly. Keeps returning to how long he has worked for Mr. Takeda.",
      pressure: "Goes quiet, looks at his hands, asks if Mr. Takeda has to know.",
      broken: "Once the CCTV is shown he admits he parked on Main Street, begs you not to tell Ren, and, wanting to make it right, says that around quarter past eight he saw a man in a light coat walking fast toward the docks.",
      background: "Ren's driver. Was told to wait outside the Harbor Office all evening.",
      secret: "I didn't wait at the office. I parked on Main Street to smoke and nap. If Ren finds out, I'm finished.",
      rules: [
        { slot: "jin.where", cover: "harbor_office", truth: "main_street", admitAfter: ["ev-cctv"] },
        { slot: "jin.saw", cover: "nobody", truth: "man_to_docks", admitAfter: ["ev-cctv"] },
      ],
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
      image: "/art/ev-keycard.webp",
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

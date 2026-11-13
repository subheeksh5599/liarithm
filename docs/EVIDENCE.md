# Evidence

Every figure and quote the README and pitch rely on, with where it came from. All pages read on 13 November 2026. This file names existing products on purpose: a "what's new here" claim needs its neighbours on the record.

## SERV Reasoning

| Claim | Source | Quote or figure |
|---|---|---|
| Base URL and endpoints | https://docs.openserv.ai/serv-reasoning/api/index | `https://inference-api.openserv.ai`, `POST /v1/chat/completions`, `/v1/responses`, `/v1/messages` |
| A system prompt is required | https://docs.openserv.ai/serv-reasoning/api/index | "A system prompt is required. Please include a system or developer message in your request." |
| What SERV does | https://docs.openserv.ai/serv-reasoning/why.md | "Each call runs through a structured reasoning step, following a bounded graph, that improves the consistency and accuracy of outputs." |
| Multipath's purpose | https://docs.openserv.ai/serv-reasoning/tutorials/multipath.md | "Use Multipath for decision trees, policy matrices, routing rules, and instructions where different conditions lead to different outcomes." |
| Multipath does not authorise actions | https://docs.openserv.ai/serv-reasoning/tutorials/multipath.md | "Multipath does not execute branches or authorize actions in your application. Keep business rules, permissions, and side-effect checks in your code." |
| Generated prompts are reused | https://docs.openserv.ai/serv-reasoning/tutorials/multipath.md | "Later requests in the same organization can reuse it when the source prompt and prompt version match." |
| Kronos | https://docs.openserv.ai/serv-reasoning/tutorials/kronos.md | "Kronos audits the reasoning prompt SERV generates from your system prompt. If the audit finds a semantic problem, SERV repairs the generated prompt and checks it again." |
| Feature suffix example model | https://docs.openserv.ai/serv-reasoning/tutorials/kronos.md | examples use `gpt-5.4-mini-serv-kronos` and `gpt-5.4-mini-serv-kronos-multipath` |
| Shadow Agent never returns an unvalidated draft on abort | https://docs.openserv.ai/serv-reasoning/tutorials/shadow-agent.md | "If the validator or regeneration call aborts, SERV returns a `502` error instead of an unvalidated draft." |
| Shadow Agent iterations | https://docs.openserv.ai/serv-reasoning/tutorials/shadow-agent.md | `max_iterations` defaults to `3`, accepts `1` to `10` |
| Prompt guard tool | https://docs.openserv.ai/serv-reasoning/why.md | "Protect your system prompt from injection-based leakage. Opt in with the `serv_prompt_guard` tool." |
| `gpt-6-luna` price | https://docs.openserv.ai/serv-reasoning/models.md | $0.130 input, $0.650 output per million tokens, 1M context; "Prices are per million tokens and include SERV Reasoning." |
| Catalogue providers | https://docs.openserv.ai/serv-reasoning/models.md | OpenAI, Anthropic and Google models only |


## Neighbours (existing AI detective games)

Public repositories found on GitHub on 13 November 2026. They show the category is established; the README's "What Liarithm is NOT" section is written against them.

| Repository | What it does | What Liarithm adds |
|---|---|---|
| https://github.com/taujeszky/Skiron | "Murder mysteries that are provably fair: a pure-TypeScript deduction engine certifies every case twice" | a per-turn lie policy enforced by a reasoning layer, and a truth hash the player re-checks |
| https://github.com/Koe10121/CASEFILE | "LLM-driven suspects, a deterministic truth engine, and an eval harness" | the brain/voice split with a referee on both sides |
| https://github.com/JiachengWu591/loosethread | "interrogate LLM-voiced suspects; every case is solver-verified" | comparison-based contradiction verdicts tied to a hash-chained log |
| https://github.com/LeonManuel0705/verdict | "every suspect is a language model that can only see its own slice of the truth" | evidence-gated unlocking of what a suspect may admit |

## Estimates (not measurements)

| Figure | How it was derived |
|---|---|
| ~400k voice input tokens per case | ~40 turns × ~10k average conversation length re-sent each turn |
| ~$0.005 voice cost per case | 400k × $0.01/M + 6k × $0.07/M |
| ~$0.03 to $0.08 brain cost per case | ~40 calls × ~3k in / ~300 out at `gpt-6-luna` prices, up to 3× for Shadow Agent iterations |

The leak benchmark and a metered test case replace these with measured numbers.

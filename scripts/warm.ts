// Primes SERV's cached reasoning prompt for every suspect. Run once after changing a case's rules.
// Usage: npx tsx --env-file=.env.local scripts/warm.ts
import { cases } from "../lib/cases";
import { decideMove } from "../lib/models";

async function main() {
  for (const c of cases) {
    for (const s of c.suspects) {
      const t0 = Date.now();
      const r = await decideMove(c, s.id, "Before we start: state your name.", [], null, [], { warm: true });
      console.log(`${c.id}/${s.id}: ${r.brain} ${r.move.move} in ${Date.now() - t0}ms`);
    }
  }
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});

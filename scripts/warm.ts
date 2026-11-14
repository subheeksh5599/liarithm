// Primes SERV's cached reasoning prompt for every suspect. Run once after changing a case's rules.
// Usage: npx tsx --env-file=.env.local scripts/warm.ts
import { blackDiamondVariants } from "../lib/cases/black-diamond";
import { decideMove } from "../lib/models";

async function main() {
  for (const c of blackDiamondVariants) {
    for (const s of c.suspects) {
      const t0 = Date.now();
      const r = await decideMove(c, s.id, "Before we start: state your name.", [], null, [], { warm: true });
      console.log(`${c.truth.culprit} version / ${s.id}: ${r.brain} ${r.move.move} in ${Date.now() - t0}ms`);
    }
  }
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});

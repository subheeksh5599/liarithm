// Runs the case checker from the command line.
//   npm run check                 checks every version of the shipped cases
//   npm run check -- my-case.json checks a case file (one object, or an array of versions)
import { readFileSync } from "node:fs";
import { blackDiamondVariants } from "../lib/cases/black-diamond";
import { sampleCase } from "../lib/cases/sample";
import { checkVersions } from "../lib/checker";

const file = process.argv[2];
const sets: [string, unknown[]][] = file
  ? [[file, ((v) => (Array.isArray(v) ? v : [v]))(JSON.parse(readFileSync(file, "utf8")))]]
  : [
      ["black-diamond", blackDiamondVariants],
      ["sample", [sampleCase]],
    ];

let failed = 0;
for (const [name, versions] of sets) {
  const r = checkVersions(versions);
  console.log(`${r.ok ? "PASS" : "FAIL"}  ${name}  (${versions.length} version${versions.length === 1 ? "" : "s"})`);
  r.versions.forEach((v, i) => {
    console.log(`  version ${i + 1}: ${v.ok ? "solvable" : "not solvable"}, ${v.provableLies.length} provable lie(s)`);
    for (const issue of v.issues) console.log(`    ${issue.code}  ${issue.message}  [${issue.at}]`);
  });
  for (const issue of r.issues) console.log(`  ${issue.code}  ${issue.message}`);
  if (!r.ok) failed++;
}
process.exit(failed ? 1 : 0);

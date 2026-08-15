import { captureEvidenceFixture } from "../lib/evidence";

async function main() {
  const evidence = await captureEvidenceFixture();
  console.log(JSON.stringify(evidence, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

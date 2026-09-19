import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  buildSupportReply,
  type SupportIntent,
} from '../src/lib/supportAssistant';

type EvalCase = {
  id: string;
  input: string;
  expectedIntent: SupportIntent;
  expectedNeedsHuman: boolean;
  mustContain: string[];
};

type EvalResult = {
  id: string;
  passed: boolean;
  checks: {
    intent: boolean;
    needsHuman: boolean;
    keywords: boolean;
  };
  output: {
    intent: SupportIntent;
    needsHuman: boolean;
    reply: string;
  };
};

function pct(num: number, den: number): string {
  if (!den) return '0.0%';
  return `${((num / den) * 100).toFixed(1)}%`;
}

async function main() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const repoRoot = path.resolve(__dirname, '..');
  const datasetPath = path.join(repoRoot, 'evals', 'support_assistant.seed.json');

  const raw = await readFile(datasetPath, 'utf8');
  const cases = JSON.parse(raw) as EvalCase[];

  const results: EvalResult[] = cases.map((c) => {
    const out = buildSupportReply(c.input);
    const lowered = out.reply.toLowerCase();

    const intentPass = out.intent === c.expectedIntent;
    const needsHumanPass = out.needsHuman === c.expectedNeedsHuman;
    const keywordsPass = c.mustContain.every((k) => lowered.includes(k.toLowerCase()));

    return {
      id: c.id,
      passed: intentPass && needsHumanPass && keywordsPass,
      checks: {
        intent: intentPass,
        needsHuman: needsHumanPass,
        keywords: keywordsPass,
      },
      output: {
        intent: out.intent,
        needsHuman: out.needsHuman,
        reply: out.reply,
      },
    };
  });

  const passed = results.filter((r) => r.passed).length;
  const failed = results.length - passed;
  const summary = {
    timestamp: new Date().toISOString(),
    total: results.length,
    passed,
    failed,
    passRate: pct(passed, results.length),
  };

  console.log('Support assistant evaluation');
  console.log('--------------------------');
  console.log(`Total: ${summary.total}`);
  console.log(`Passed: ${summary.passed}`);
  console.log(`Failed: ${summary.failed}`);
  console.log(`Pass rate: ${summary.passRate}`);

  const failedRows = results.filter((r) => !r.passed);
  if (failedRows.length) {
    console.log('\nFailures:');
    for (const row of failedRows) {
      console.log(
        `- ${row.id} intent=${row.checks.intent} needsHuman=${row.checks.needsHuman} keywords=${row.checks.keywords}`,
      );
    }
  }

  const reportDir = path.join(repoRoot, 'evals', 'reports');
  await mkdir(reportDir, { recursive: true });
  const reportPath = path.join(reportDir, 'support_assistant.latest.json');
  await writeFile(reportPath, JSON.stringify({ summary, results }, null, 2), 'utf8');
  console.log(`\nWrote report: ${path.relative(repoRoot, reportPath)}`);

  if (process.env.EVAL_STRICT === '1' && failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error('Failed to run support assistant eval:', err);
  process.exit(1);
});

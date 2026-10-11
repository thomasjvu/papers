import { architectureTests } from './architecture.test.ts';
import { routePreloadTests } from './route-preloads.test.ts';

const testCases = [...architectureTests, ...routePreloadTests];

let failures = 0;

for (const testCase of testCases) {
  try {
    await testCase.run();
    console.log(`PASS ${testCase.name}`);
  } catch (error) {
    failures += 1;
    console.error(`FAIL ${testCase.name}`);
    console.error(error);
  }
}

if (failures > 0) {
  console.error(`\n${failures} test(s) failed.`);
  process.exit(1);
}

console.log(`\n${testCases.length} test(s) passed.`);

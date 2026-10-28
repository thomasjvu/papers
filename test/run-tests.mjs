import { architectureTests } from './architecture.test.ts';
import { routePreloadTests } from './route-preloads.test.ts';
import { authoringFeatureTests } from './authoring-features.test.ts';
import { docsParityTests } from './docs-parity.test.ts';
import { scriptHelperTests } from './script-helpers.test.ts';
import { llmsArtifactTests } from './llms-artifacts.test.ts';
import { buildIdentityTests } from './build-identity.test.ts';
import { routeModelTests } from './route-model.test.ts';
import { seoRouteTests } from './seo-routes.test.ts';
import { designBookTests } from './design-book.test.ts';
import { openapiLabelTests } from './openapi-labels.test.ts';
import { scriptLibTests } from './script-libs.test.ts';
import { internalHrefTests } from './internal-href.test.ts';
import { graphNodeViewTests } from './graph-node-view.test.ts';
import { markdownElementsTests } from './markdown-elements.test.ts';
import { documentationPageViewTests } from './documentation-page-view.test.ts';

const testCases = [
  ...architectureTests,
  ...routePreloadTests,
  ...authoringFeatureTests,
  ...docsParityTests,
  ...scriptHelperTests,
  ...llmsArtifactTests,
  ...buildIdentityTests,
  ...routeModelTests,
  ...seoRouteTests,
  ...designBookTests,
  ...openapiLabelTests,
  ...scriptLibTests,
  ...internalHrefTests,
  ...graphNodeViewTests,
  ...documentationPageViewTests,
  ...markdownElementsTests,
];

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

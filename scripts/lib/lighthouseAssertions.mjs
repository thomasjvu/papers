function readAssertionLevel(id, assertion) {
  if (!Array.isArray(assertion) || assertion.length < 2) {
    throw new Error(`Unsupported assertion format for ${id}`);
  }

  const [level, options] = assertion;
  if (level !== 'error' && level !== 'warn') {
    throw new Error(`Unsupported assertion level for ${id}: ${level}`);
  }

  return { level, options };
}

function measure(lhr, id, options) {
  if (id.startsWith('categories:')) {
    const actual = lhr.categories?.[id.slice('categories:'.length)]?.score;
    return { actual, passes: typeof actual === 'number' && actual >= options.minScore };
  }

  const actual = lhr.audits?.[id]?.numericValue;
  return { actual, passes: typeof actual === 'number' && actual <= options.maxNumericValue };
}

/** Evaluates one Lighthouse CI style assertion (`[level, { minScore | maxNumericValue }]`). */
export function evaluateAssertion(lhr, id, assertion) {
  const { level, options } = readAssertionLevel(id, assertion);
  const { actual, passes } = measure(lhr, id, options);

  return { id, level, actual, passes };
}

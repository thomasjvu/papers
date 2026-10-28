/** Split a link target into its path and the `#hash`/`?query` suffix that follows it. */
export function splitTargetSuffix(target) {
  const hashIndex = target.indexOf('#');
  const queryIndex = target.indexOf('?');
  const splitIndex =
    hashIndex === -1 ? queryIndex : queryIndex === -1 ? hashIndex : Math.min(hashIndex, queryIndex);

  if (splitIndex === -1) {
    return { pathname: target, suffix: '' };
  }

  return {
    pathname: target.slice(0, splitIndex),
    suffix: target.slice(splitIndex),
  };
}

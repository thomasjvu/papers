#!/usr/bin/env node
// CRAP report: CRAP(fn) = complexity^2 * (1 - coverage)^3 + complexity.
// Complexity is cyclomatic (ESLint `complexity` rule semantics); coverage is the
// fraction of a function's own statements hit by `npm test` (c8, istanbul JSON).
import { existsSync, globSync, readFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import ts from 'typescript';

const root = resolve(import.meta.dirname, '../..');
const args = process.argv.slice(2);
const option = (name, fallback) => {
  const index = args.indexOf(`--${name}`);
  return index === -1 ? fallback : args[index + 1];
};
const threshold = Number(option('threshold', '10'));
const limit = Number(option('top', '40'));
const coveragePath = resolve(root, option('coverage', 'coverage/coverage-final.json'));
const check = args.includes('--check');
const patterns = ['src/**/*.{ts,tsx}', 'shared/**/*.{js,mjs,ts}', 'scripts/**/*.{js,mjs}'];
const ignored = [/\.d\.ts$/, /^src\/lib\/generated\//, /^scripts\/quality\//];

export function crapScore(complexity, coverage) {
  return complexity ** 2 * (1 - coverage) ** 3 + complexity;
}

function readCoverage() {
  if (!existsSync(coveragePath)) {
    console.error(
      `No coverage at ${relative(root, coveragePath)}; run \`npm run quality:coverage\` first.`
    );
    process.exit(2);
  }
  const byFile = new Map();
  for (const [file, data] of Object.entries(JSON.parse(readFileSync(coveragePath, 'utf8')))) {
    byFile.set(relative(root, file), data);
  }
  return byFile;
}

const decisionKinds = new Set([
  ts.SyntaxKind.IfStatement,
  ts.SyntaxKind.ConditionalExpression,
  ts.SyntaxKind.ForStatement,
  ts.SyntaxKind.ForInStatement,
  ts.SyntaxKind.ForOfStatement,
  ts.SyntaxKind.WhileStatement,
  ts.SyntaxKind.DoStatement,
  ts.SyntaxKind.CatchClause,
]);
const logicalOperators = new Set([
  ts.SyntaxKind.AmpersandAmpersandToken,
  ts.SyntaxKind.BarBarToken,
  ts.SyntaxKind.QuestionQuestionToken,
  ts.SyntaxKind.AmpersandAmpersandEqualsToken,
  ts.SyntaxKind.BarBarEqualsToken,
  ts.SyntaxKind.QuestionQuestionEqualsToken,
]);

function isDecision(node) {
  if (decisionKinds.has(node.kind)) return true;
  if (ts.isCaseClause(node)) return true;
  if (ts.isBinaryExpression(node)) return logicalOperators.has(node.operatorToken.kind);
  if (ts.isParameter(node) || ts.isBindingElement(node)) return Boolean(node.initializer);
  return Boolean(node.questionDotToken);
}

function functionName(node, source) {
  if (node.name) return node.name.getText(source);
  const parent = node.parent;
  if (
    parent &&
    (ts.isVariableDeclaration(parent) || ts.isPropertyAssignment(parent)) &&
    parent.name
  ) {
    return parent.name.getText(source);
  }
  if (parent && ts.isCallExpression(parent))
    return `${parent.expression.getText(source).slice(0, 40)}(callback)`;
  return '<anonymous>';
}

function collectFunctions(source) {
  const functions = [];
  const visit = (node, owner) => {
    let current = owner;
    if (ts.isFunctionLike(node) && 'body' in node && node.body) {
      current = { node, name: functionName(node, source), complexity: 1 };
      functions.push(current);
    } else if (current && isDecision(node)) {
      current.complexity += 1;
    }
    ts.forEachChild(node, (child) => visit(child, current));
  };
  visit(source, undefined);
  return functions;
}

function lineColumn(source, position) {
  const { line, character } = source.getLineAndCharacterOfPosition(position);
  return { line: line + 1, column: character };
}

function before(a, b) {
  return a.line < b.line || (a.line === b.line && a.column <= b.column);
}

function functionCoverage(fn, source, fileCoverage, functions) {
  if (!fileCoverage) return 0;
  const start = lineColumn(source, fn.node.getStart(source));
  const end = lineColumn(source, fn.node.getEnd());
  const nested = functions
    .filter(
      (other) => other !== fn && other.node.pos >= fn.node.pos && other.node.end <= fn.node.end
    )
    .map((other) => [
      lineColumn(source, other.node.getStart(source)),
      lineColumn(source, other.node.getEnd()),
    ]);
  let total = 0;
  let covered = 0;
  for (const [id, location] of Object.entries(fileCoverage.statementMap)) {
    const inside = before(start, location.start) && before(location.end, end);
    const inNested = nested.some(
      ([nestedStart, nestedEnd]) =>
        before(nestedStart, location.start) && before(location.end, nestedEnd)
    );
    if (!inside || inNested) continue;
    total += 1;
    if (fileCoverage.s[id] > 0) covered += 1;
  }
  if (total === 0)
    return fileCoverage.f && Object.values(fileCoverage.f).some((hits) => hits > 0) ? 1 : 0;
  return covered / total;
}

function analyse() {
  const coverage = readCoverage();
  const files = patterns
    .flatMap((pattern) => globSync(pattern, { cwd: root }))
    .filter((file) => !ignored.some((pattern) => pattern.test(file)))
    .sort();
  const rows = [];
  for (const file of files) {
    const text = readFileSync(resolve(root, file), 'utf8');
    const kind = file.endsWith('x')
      ? ts.ScriptKind.TSX
      : file.endsWith('.ts')
        ? ts.ScriptKind.TS
        : ts.ScriptKind.JS;
    const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, kind);
    const functions = collectFunctions(source);
    for (const fn of functions) {
      const covered = functionCoverage(fn, source, coverage.get(file), functions);
      rows.push({
        file,
        line: lineColumn(source, fn.node.getStart(source)).line,
        name: fn.name,
        complexity: fn.complexity,
        coverage: covered,
        crap: crapScore(fn.complexity, covered),
      });
    }
  }
  return rows.sort((a, b) => b.crap - a.crap);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const rows = analyse();
  const offenders = rows.filter((row) => row.crap >= threshold);
  const json = args.includes('--json');
  if (json) {
    console.log(JSON.stringify({ threshold, functions: rows.length, offenders }, null, 2));
  } else {
    for (const row of offenders.slice(0, limit)) {
      const where = `${row.file}:${row.line}`;
      console.log(
        `${row.crap.toFixed(1).padStart(8)}  cc=${String(row.complexity).padStart(3)}  cov=${(row.coverage * 100).toFixed(0).padStart(3)}%  ${where} ${row.name}`
      );
    }
    console.log(`\n${offenders.length} of ${rows.length} functions have CRAP >= ${threshold}.`);
  }
  if (check && offenders.length > 0) process.exit(1);
}

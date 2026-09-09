// Pulls the documentation out of the upkeep repository into this site.
//
// The docs are NOT authored here. They live beside the code, in owenbush/upkeep,
// so that a change to a command and the change to the page describing it land in
// the same pull request and are reviewed together. This site is presentation.
//
// That is not a preference. The previous version of this site kept its own copy
// of the command table and the dashboard mockup; both drifted, silently, until
// the table listed 11 of 27 commands and the mockup showed a column the data
// model no longer has. A copy nothing forces to change is a copy that is wrong.
//
// Usage: node scripts/sync-docs.mjs [path-to-upkeep-repo]   (default ../upkeep)

import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const repo = resolve(process.argv[2] ?? process.env.UPKEEP_REPO ?? '../upkeep');
const out = resolve('src/content/docs');

if (!existsSync(join(repo, 'docs'))) {
  console.error(`No docs/ directory in ${repo}.\nPass the upkeep checkout: node scripts/sync-docs.mjs ../upkeep`);
  process.exit(1);
}

// Source (relative to upkeep/docs) -> where it lands here. The site route is
// derived from the destination, so this table is the single place that decides
// both the file layout and every rewritten link.
const PAGES = [
  ['guide/install.md', 'guide/install.md'],
  ['guide/gitlab-token.md', 'guide/gitlab-token.md'],
  ['guide/cockpit.md', 'guide/cockpit.md'],
  ['base-artifacts.md', 'guide/base-artifacts.md'],
  ['guide/publishing.md', 'guide/publishing.md'],
  ['guide/dashboard.md', 'guide/dashboard.md'],
  ['guide/issue-loop.md', 'guide/issue-loop.md'],
  ['guide/patches.md', 'guide/patches.md'],
  ['guide/checks.md', 'guide/checks.md'],
  ['guide/review-and-merge.md', 'guide/review-and-merge.md'],
  ['guide/environments.md', 'guide/environments.md'],
  ['guide/fixtures.md', 'guide/fixtures.md'],
  ['commands.md', 'reference/commands.md'],
  ['reference/exit-codes.md', 'reference/exit-codes.md'],
  ['reference/disk.md', 'reference/disk.md'],
  ['reference/upgrading.md', 'reference/upgrading.md'],
  ['contrib-maintainer-design.md', 'design/architecture.md'],
  ['dashboard-row-model.md', 'design/row-model.md'],
  ['any-module.md', 'design/any-module.md'],
];

const route = (dest) => '/' + dest.replace(/\.md$/, '') + '/';
const ROUTES = new Map(PAGES.map(([src, dest]) => [src, route(dest)]));
// The docs index is the sidebar here, so links to it go to the first page.
ROUTES.set('README.md', '/guide/install/');

/** Resolve a relative .md link against the file it appears in. */
function resolveLink(fromSource, target) {
  const joined = join(dirname(fromSource), target).replace(/\\/g, '/');
  return ROUTES.get(joined.replace(/^\.\//, ''));
}

/** Title, description and body, from a document that starts with an H1. */
function parse(markdown) {
  const lines = markdown.split('\n');
  const h1 = lines.findIndex((l) => l.startsWith('# '));
  if (h1 === -1) throw new Error('no H1');
  const title = lines[h1].slice(2).trim();

  const rest = lines.slice(h1 + 1);
  const start = rest.findIndex((l) => l.trim() !== '');
  let description = '';
  if (start !== -1 && !rest[start].startsWith('#') && !rest[start].startsWith('```')) {
    const end = rest.slice(start).findIndex((l) => l.trim() === '');
    description = rest
      .slice(start, end === -1 ? undefined : start + end)
      .join(' ')
      .replace(/`([^`]*)`/g, '$1')
      .replace(/\*\*([^*]*)\*\*/g, '$1')
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/\s+/g, ' ')
      .trim();
    if (description.length > 158) description = description.slice(0, 155).replace(/[\s,;:—-]+$/, '') + '…';
  }

  return { title, description, body: rest.slice(start === -1 ? 0 : start).join('\n').trim() };
}

rmSync(join(out, 'guide'), { recursive: true, force: true });
rmSync(join(out, 'reference'), { recursive: true, force: true });
rmSync(join(out, 'design'), { recursive: true, force: true });

let unresolved = 0;
for (const [source, dest] of PAGES) {
  const raw = readFileSync(join(repo, 'docs', source), 'utf8');
  const { title, description, body } = parse(raw);

  // Relative .md links become site routes. An unmapped one is a hard failure:
  // a docs build that quietly emits dead links is the drift this replaces.
  const rewritten = body.replace(/\]\(([^):\s]+\.md)(#[^)\s]*)?\)/g, (whole, target, anchor = '') => {
    const to = resolveLink(source, target);
    if (!to) {
      console.error(`  ${source}: link to "${target}" is not a synced page`);
      unresolved++;
      return whole;
    }
    return `](${to}${anchor})`;
  });

  const frontmatter = ['---', `title: ${JSON.stringify(title)}`]
    .concat(description ? [`description: ${JSON.stringify(description)}`] : [])
    .concat(['---', '']);

  const target = join(out, dest);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, frontmatter.join('\n') + rewritten + '\n');
  console.log(`  ${source.padEnd(34)} -> ${route(dest)}`);
}

if (unresolved > 0) {
  console.error(`\n${unresolved} link(s) point outside the synced set. Add them to PAGES or fix the source.`);
  process.exit(1);
}
console.log(`\nSynced ${PAGES.length} pages from ${repo}.`);

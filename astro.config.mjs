// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// The docs under src/content/docs/{guide,reference,design} are NOT authored
// here — `npm run sync` pulls them from the upkeep repository, where they sit
// beside the code they describe. See scripts/sync-docs.mjs.
export default defineConfig({
  site: 'https://upkeep.owenbush.dev',
  integrations: [
    starlight({
      title: 'Upkeep',
      description:
        'A maintenance orchestrator CLI for contributed Drupal modules: every open contribution, ' +
        'checked in an isolated environment, merged one deliberate approval at a time.',
      customCss: ['./src/styles/upkeep.css'],
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/owenbush/upkeep' },
      ],
      editLink: {
        // Straight to the source of truth, not to this repository.
        baseUrl: 'https://github.com/owenbush/upkeep/edit/main/docs/',
      },
      sidebar: [
        {
          label: 'Getting started',
          items: [
            { label: 'Install', slug: 'guide/install' },
            { label: 'GitLab token', slug: 'guide/gitlab-token' },
            { label: 'Set up a cockpit', slug: 'guide/cockpit' },
            { label: 'Base artifacts', slug: 'guide/base-artifacts' },
            { label: 'Publishing: issue forks and SSH', slug: 'guide/publishing' },
          ],
        },
        {
          label: 'Daily flow',
          items: [
            { label: 'The dashboard', slug: 'guide/dashboard' },
            { label: 'Work on an issue', slug: 'guide/issue-loop' },
            { label: 'Patch contributions', slug: 'guide/patches' },
            { label: 'Running checks', slug: 'guide/checks' },
            { label: 'Review, merge and release notes', slug: 'guide/review-and-merge' },
            { label: 'Working in an environment', slug: 'guide/environments' },
            { label: 'Fixtures', slug: 'guide/fixtures' },
            { label: 'Browser UI', slug: 'guide/ui' },
          ],
        },
        {
          label: 'Reference',
          items: [
            { label: 'Every command', slug: 'reference/commands' },
            { label: 'Exit codes', slug: 'reference/exit-codes' },
            { label: 'Disk housekeeping', slug: 'reference/disk' },
            { label: 'Upgrading a cockpit', slug: 'reference/upgrading' },
          ],
        },
        {
          label: 'Design',
          collapsed: true,
          items: [
            { label: 'Architecture and rationale', slug: 'design/architecture' },
            { label: 'The dashboard row model', slug: 'design/row-model' },
            { label: 'Any module, not just yours', slug: 'design/any-module' },
          ],
        },
      ],
    }),
  ],
});

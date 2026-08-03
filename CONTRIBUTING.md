# Contributing to this Muso Dojo Project

Thank you for your interest in **Muso Dojo**! We appreciate the community's support and enthusiasm for building better tools for music education.

## Our Current Phase

**At this time, we are not accepting external code contributions or Pull Requests.**

This project is currently in an active, early-stage development phase. Our internal roadmap and core architecture are evolving rapidly. To maintain development velocity and ensure a cohesive vision during this foundational period, the project is being developed exclusively by its core maintainers.

## Maintainer Quality Checks

The supported Node.js runtime matches production on Vercel and is declared in
`.nvmrc` and `package.json`. With nvm, install and activate it from the repository
root with `nvm install` and `nvm use`; both commands read `.nvmrc`. The exact
pnpm version is pinned in the `packageManager` field in `package.json`. Install
that declared version locally and confirm `pnpm --version` matches it; Corepack
is not required. Python is pinned in `.python-version` for the audio verification
tooling and can be installed and selected with pyenv.

From a clean checkout, reproduce the GitHub Actions quality baseline with:

```sh
pnpm install --frozen-lockfile
pnpm check:ci
```

The check covers formatting, strict linting, TypeScript, unit-test coverage,
generated audio provenance, and the production plus service-worker build.
Coverage is reported diagnostically in `coverage/`; repository-wide percentage
thresholds are intentionally not enforced yet.

## How You Can Help

While we aren't merging PRs yet, your feedback is still incredibly valuable to us:

1.  **Bug Reports**: If you find something broken, please [open an issue](https://github.com/conor-dowdall/muso-dojo-next/issues). Be as descriptive as possible, including steps to reproduce the issue.
2.  **Feature Suggestions**: Have an idea for a new interactive tool or musical visualization? Open a "Feature Request" issue to start a discussion.
3.  **Spread the Word**: Use the tools, share them with your students or teachers, and let us know what you think!

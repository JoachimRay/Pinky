# Contributing to Pinky

Thank you for helping build Pinky, an inclusive LGBTQ+ dating experience.

## Set up the project

Requirements: Node.js, npm, and Expo Go, an iOS simulator, Android emulator,
or a web browser.

```bash
npm install
npm start
```

Use `npm run web`, `npm run ios`, or `npm run android` for a specific target.
Optional AI features require Ollama with `qwen3:4b` or the environment
variables documented in [README.md](./README.md).

## Checks and testing

```bash
npx tsc --noEmit
npm run lint
```

Manually verify browse, Pass/Violet, mutual match, chat suggestions, and the
fallback path before submitting changes.

## Where changes belong

| Area | Location |
| --- | --- |
| Expo screens and API routes | `app/` |
| Reusable UI | `components/` |
| Session and shared logic | `lib/` |
| Demo profiles and assets | `data/` and `assets/` |
| Types and constants | `types/` and `constants/` |
| Tests | Add focused tests beside the related source or in `tests/` |
| Documentation | `README.md`, `CHANGELOG.md`, and `docs/` |
| Server work | `app/api/` unless a future backend is introduced |

Keep production changes separate from demo-only behavior and update the
documentation when commands, architecture, or feature scope changes.

## Issues and pull requests

Use the issue templates for bug reports and feature requests. Include clear
steps to reproduce, expected and actual behavior, runtime/device details, and
screenshots or logs when useful.

For pull requests:

1. Create a focused branch.
2. Explain what changed and why.
3. Run the available checks and describe the results.
4. Update related documentation.
5. Request review only after the branch is ready.

Please do not include credentials or other secrets in issues, pull requests,
screenshots, or commits.
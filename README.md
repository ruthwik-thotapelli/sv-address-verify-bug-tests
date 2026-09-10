# SV Address Verify — Bug Tests

![Bug Test Suite](https://github.com/ruthwik-thotapelli/sv-address-verify-bug-tests/actions/workflows/test.yml/badge.svg)
![Bugs Found](https://img.shields.io/badge/bugs%20confirmed-13-red)
![Tests](https://img.shields.io/badge/framework-Jest%20%2B%20Supertest-C21325)
![Node](https://img.shields.io/badge/node-%3E%3D18-339933?logo=node.js&logoColor=white)
![License](https://img.shields.io/badge/license-unspecified-lightgrey)

Automated Jest + Supertest suite that codifies **13 confirmed bugs** found while validating the Address Verification app (current/permanent address form + matching API) against its written spec. Each bug has a test that **fails on the current implementation** and passes once the bug is fixed — the suite doubles as a regression net and a living bug report.

> Built with the help of Antigravity AI (Google DeepMind) to analyze source code, validate APIs against specifications, identify bugs, and generate tests. Behavior was manually verified with PowerShell and debugged in VS Code.

## Contents

- [What this repo contains](#-what-this-repo-contains)
- [Bugs covered](#-bugs-covered-13)
- [Getting started](#-getting-started)
- [Test design](#-test-design)
- [CI](#-continuous-integration)
- [Fixing a bug](#-fixing-a-bug)
- [Security notes](#️-security-notes)
- [License](#-license)

---

## 📌 What this repo contains

| Path | Purpose |
|---|---|
| `server.js` | Express server exposing `POST /api/address` and `GET /api/address/:candidateId` |
| `data.js` | In-memory data store / seed data used by the API |
| `isolation.js` | Helpers to reset/isolate state between test runs |
| `public/` | Frontend UI — address form (Current + Permanent), submitted addresses table |
| `tests/` | Jest + Supertest specs, one per confirmed bug |
| `my_bug_report.md` | Full write-up of all 13 bugs (issue, expected vs. actual) |
| `package.json` / `package-lock.json` | Dependencies & npm scripts |

---

## 🐛 Bugs covered (13)

| # | Area | Bug | Expected | Actual |
|---|------|-----|----------|--------|
| 1 | API | Wrong status code on submit | `201 Created` | `200 OK` |
| 2 | API | Wrong status code on unknown candidate | `404 Not Found` | `200 OK` with `null` |
| 3 | API | `matchPercent` divides by 3, ignores `line1` | `25%` (1 of 4 fields) | `33%` (1 of 3) |
| 4 | API | Pincode starting with `0` accepted | `400 Bad Request` | `200 OK`, invalid pincode stored |
| 5 | API | `state` accepts any string (no enum check) | `400 Bad Request` | `200 OK`, arbitrary value accepted |
| 6 | API | Missing `candidateId` silently defaults to `0` | `400 Bad Request` | `200 OK`, record created with `candidateId=0` |
| 7 | UI | State dropdown pre-selects "Karnataka" | Empty placeholder | "Karnataka" pre-selected |
| 8 | UI | No inline validation error for bad pincode | Inline error shown live | No feedback until/unless submit |
| 9 | UI | "Same as current" checkbox doesn't mirror/disable fields | Permanent fields disabled & auto-filled live | Fields stay editable & independent |
| 10 | UI | Match % shown without `%` sign | `"100%"`, `"25%"` | `"100"`, `"25"` |
| 11 | API | `sameAsPermanent` defaults to `true` when omitted | Defaults to `false` | Defaults to `true` |
| 12 | API | No input sanitization (stored XSS) | HTML/script stripped or rejected | Raw HTML/JS stored as-is |
| 13 | UI | `line1` rendered without HTML-escaping (stored XSS) | Escaped like `city`/`state`/`pincode` | Injected as raw HTML |

Full details, including exact request/response examples, are in [`my_bug_report.md`](./my_bug_report.md).

---

## 🚀 Getting started

### Prerequisites
- [Node.js](https://nodejs.org/) 18+
- npm

### Install
```bash
git clone https://github.com/ruthwik-thotapelli/sv-address-verify-bug-tests.git
cd sv-address-verify-bug-tests
npm install
```

### Run the server
```bash
node server.js
```
The UI is served from `public/` and the API listens on the port configured in `server.js`.

### Run the test suite
```bash
npm test
```
All 13 tests are expected to **fail** against the current codebase — that's the point. Each failure is a reproduction of a confirmed bug.

---

## 🧪 Test design

Each test in `tests/` follows the same pattern:

1. **Arrange** — set up input (candidate payload, form state, or stored data via `data.js` / `isolation.js`).
2. **Act** — call the relevant endpoint with Supertest, or assert on the rendered UI output.
3. **Assert** — check the response against the **spec**, not the current buggy behavior, so the test fails until the bug is fixed.

`isolation.js` resets shared state between tests so bugs can be reproduced deterministically and in any order.

---

## ⚙️ Continuous integration

A GitHub Actions workflow (`.github/workflows/test.yml`) runs the full suite on every push and pull request to `main`, across Node 18.x and 20.x, and uploads any coverage/report artifacts.

Because the tests are **intentionally red** until bugs are fixed, the job uses `continue-on-error: true` so CI stays informative (you can see which of the 13 are still failing) without blocking merges on expected failures. Once you start fixing bugs, consider removing `continue-on-error` and asserting on pass count instead, so CI turns into a real gate.

To add it to this repo:
```bash
mkdir -p .github/workflows
mv test.yml .github/workflows/test.yml
git add .github/workflows/test.yml
git commit -m "Add CI workflow for bug test suite"
git push
```

---

## 🔧 Fixing a bug

Fixing bugs is an optional bonus on top of the test suite. To fix one:

1. Pick a bug from the table above.
2. Update `server.js` (API bugs) or the relevant file in `public/` (UI bugs).
3. Re-run `npm test` — the corresponding test should flip from ❌ to ✅.
4. Repeat for the rest, or submit fixes incrementally via PR.

---

## 🛡️ Security notes

Bugs **#12** and **#13** are stored XSS vulnerabilities — untrusted input (`line1`, `city`, etc.) is persisted and/or rendered without sanitization or escaping. Treat these as high priority regardless of the rest of the backlog.

---

## 📄 License

No license specified yet — add one (e.g. MIT) if you intend this repo to be reused publicly.

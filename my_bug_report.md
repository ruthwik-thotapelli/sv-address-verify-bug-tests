# Address Verification Form — Bug Finding Report

## Executive Summary

This repository contains an Express-based address verification application with a UI form and a REST API for storing and retrieving address submissions. During validation against the written specification, I identified and documented 13 confirmed defects spanning API contract handling, input validation, UI default-state behavior, match percentage normalization, and client-side / server-side sanitization.

The goal of this exercise was to transform the observed system behavior into a reliable, executable regression test suite. Each discovered issue is represented as a failing automated test that reproduces the defect in a deterministic way, making the project suitable for test-first debugging, quality verification, and ongoing remediation.

---

## Scope

The system under inspection supports:

- A candidate submission flow with current and permanent address fields
- An address comparison model for `sameAsPermanent`
- A match percentage calculation for address similarity
- A table that renders previously submitted records
- Express-based API endpoints for posting, retrieving, listing, and resetting submissions

The known defects materially impact specification compliance, product reliability, and user trust.

---

## Automated Bug Coverage

The following 13 defects were confirmed and codified into the automated test suite:

| # | Area | Defect | Expected Behavior | Observed Behavior |
|---|------|-------|------------------|------------------|
| 1 | API | Wrong status code on submit | `201 Created` | `200 OK` |
| 2 | API | Missing candidate lookup handling | `404 Not Found` | `200 OK` with `null` |
| 3 | API | Wrong match percentage denominator | `25%` for one matching field out of four | `33%` from a denominator of three |
| 4 | API | Pincode rules allow invalid format | Reject invalid pincode input | Accepts faulty format |
| 5 | API | Missing enum/state validation | `400` for invalid state | Accepts arbitrary state string |
| 6 | API | Missing required field enforcement | Reject missing `candidateId` | Defaults to `0` and allows creation |
| 7 | UI | Dropdown default selection bug | Empty placeholder state | Preselects Karnataka |
| 8 | UI | Missing inline validation feedback | Inline pincode error shown immediately | No feedback until submit |
| 9 | UI | Same-as-current checkbox does not live-sync fields | Permanent fields mirror current address live | Fields remain independent |
| 10 | UI | Match percentage display bug | Display includes `%` sign | Display is numeric only |
| 11 | API | Wrong `sameAsPermanent` default | Defaults to `false` | Defaults to `true` |
| 12 | API | Missing input sanitization | Reject or sanitize HTML/JS payloads | Stores raw script/HTML |
| 13 | UI | Missing HTML escaping on render | Protect UI rendering from HTML injection | Renders stored line1 as raw HTML |

---

## Detailed Findings

### 1. POST /api/address — wrong status code

The `POST /api/address` endpoint responds with `HTTP 200` instead of `HTTP 201 Created` on successful submission. The API contract requires a successful create operation to return a `201` response.

Expected: `201 Created`
Observed: `200 OK`

### 2. GET /api/address/:candidateId — wrong status code

The retrieval endpoint for a missing candidate returns `HTTP 200` and a JSON `null` payload instead of the expected `HTTP 404 Not Found` response. This creates a misleading success case when a candidate record is absent.

Expected: `404 Not Found`
Observed: `200 OK` with `null`

### 3. POST /api/address — wrong arithmetic in matchPercent

The `matchPercent` calculation is based on a denominator of `3` instead of `4` and ignores the `line1` field in the comparison. A correct implementation must compare the four standard fields `line1`, `city`, `state`, and `pincode` and return a percentage over all four fields.

Expected: `25%` when one of four fields matches
Observed: `33%` because the denominator is incorrectly set to `3`

### 4. POST /api/address — pincode boundary validation bug

The validation regex accepts pincode strings that begin with a non-positive leading digit or produce an off-by-one length boundary issue. The intended rule is strict and consistent with the Indian pincode format.

Expected: reject invalid pincode entries with a `400`
Observed: invalid values are accepted and stored

### 5. POST /api/address — state enum validation missing

The system accepts any arbitrary `state` string rather than enforcing the allowed list of states. That breaks business validation and creates inconsistent records.

Expected: state must be selected from the approved list of Indian state/UT values
Observed: arbitrary strings are accepted silently

### 6. POST /api/address — required field validation missing for `candidateId`

A request that omits `candidateId` is accepted and the server silently falls back to the value `0`, creating a record rather than enforcing domain requirements. `candidateId` must be present and must be a positive integer.

Expected: reject missing `candidateId` with `400`
Observed: fallback to `0` and record creation with `200`

### 7. UI — dropdown default selection bug

The UI loads with the state dropdowns initialized to a default value of `Karnataka`, even though the UI should offer an empty placeholder and force an explicit user choice.

Expected: empty dropdown placeholder
Observed: `Karnataka` preselected by default

### 8. UI — missing inline feedback for invalid pincode

The form contains a pincode error placeholder in the DOM but never updates it before form submission. This is a usability gap that prevents the UI from providing immediate, actionable feedback.

Expected: inline feedback appears as the user enters invalid data
Observed: no inline error path exists

### 9. UI — same-as-current checkbox does not synchronize state

The “same as permanent” checkbox is intended to copy or disable and mirror the permanent address fields from the current address. The implementation does not maintain this relationship through live UI updates.

Expected: permanent fields mirror the current address and disable when selected
Observed: permanent fields remain editable and independent

### 10. UI — percent sign formatting missing

The table row uses the raw match value without formatting. Product semantics require the percent sign to be shown for readability and consistency with the user-facing contract.

Expected: `100%`, `25%`, `0%`
Observed: `100`, `25`, `0`

### 11. POST /api/address — incorrect default for `sameAsPermanent`

The server incorrectly defaults `sameAsPermanent` to `true` when the field is omitted. The expected default behavior is `false`.

Expected: `sameAsPermanent = false`
Observed: omitted field becomes `true`

### 12. POST /api/address — input sanitization gap

The API accepts raw HTML and script-like payloads in address fields and persists them into the in-memory data model without normalization or rejection. This introduces a clear unsafe-input handling weakness.

Expected: proper sanitization or rejection
Observed: stored payload remains raw and executable-looking

### 13. UI — line1 rendering is not safely escaped

The view layer interpolates `line1` directly into the HTML table without an `escapeHtml()` wrapper. This creates a cross-site scripting display flaw because malicious user-provided text may be rendered as active HTML in the browser.

Expected: safely render `line1` with HTML escaping
Observed: raw HTML/JS may be reflected into the UI

---

## Quality Review Outcome

This exercise demonstrates a disciplined bug-reporting workflow:

1. Validate the implementation against the stated specification.
2. Author a failing test that captures the contract violation.
3. Confirm the mismatch between expected and observed API/UI behavior.
4. Produce a clear remediation path for each issue.

The strongest engineering signal is not merely that the bugs were found, but that they were formalized into repeatable automated tests and traced to precise contract violations.

---

## Final Note

The project is intentionally designed as a bug discovery and regression-testing environment. The test suite is meant to reproduce the failures in a transparent, deterministic, and teachable way. This report documents the reproduced defects in a structured and review-ready format for engineering evaluation and remediation.


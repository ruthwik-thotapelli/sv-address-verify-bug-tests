# My bug report — 02

You reported 13 confirmed bugs. For Phase 2, write an automated test that FAILS because of each one — fixing them is an optional bonus.

## 1. POST /api/address — wrong-status-code

Issue: POST /api/address returns HTTP 200 instead of 201 Created. The spec explicitly states a successful submission must return 201.
Expected vs actual: Expected: HTTP 201 Created. Actual: HTTP 200 OK.

## 2. GET /api/address/:candidateId — wrong-status-code

Issue: When requesting a candidateId that has no submission (e.g., /api/address/999), the API returns HTTP 200 with body null instead of HTTP 404 Not Found.
Expected vs actual: Expected: HTTP 404 with error message. Actual: HTTP 200 with body null.

## 3. POST /api/address — wrong-arithmetic

Issue: matchPercent is calculated by dividing matched fields by 3 instead of 4. The spec says matchPercent = percentage of all 4 fields (line1, city, state, pincode) that match. When only state matches, the API returns 33 (1/3) instead of 25 (1/4). The line1 field is excluded from the calculation.
Expected vs actual: Expected: matchPercent=25 when 1 out of 4 fields match (e.g. state matches, rest differ). Actual: matchPercent=33 — server divides by 3, completely ignoring the line1 field.

## 4. POST /api/address — off-by-one-boundary

Issue: The API accepts pincodes starting with digit 0 (e.g. "012345"), which is invalid. The spec regex /^[1-9][0-9]{5}$/ explicitly requires the first digit to be 1-9. Indian pincodes never start with 0.
Expected vs actual: Expected: HTTP 400 when pincode starts with 0. Actual: HTTP 200, pincode starting with 0 accepted and stored.

## 5. POST /api/address — missing-enum-validation

Issue: The state field accepts any arbitrary string with no validation. The spec restricts state to a fixed list of 8 values: Karnataka, Maharashtra, Delhi, Tamil Nadu, Telangana, Uttar Pradesh, West Bengal, Gujarat. Tested with state="INVALID_STATE_XYZ" — returns HTTP 200.
Expected vs actual: Expected: HTTP 400 when state is not in the allowed list. Actual: HTTP 200, any state string accepted and stored.

## 6. POST /api/address — missing-required-field

Issue: When POST /api/address is called without the candidateId field in the request body, the server silently defaults it to 0 and creates the record (HTTP 200). candidateId is a required field and its absence should return HTTP 400.
Expected vs actual: Expected: HTTP 400 with error "candidateId is required" when field is absent. Actual: HTTP 200, record created with candidateId=0.

## 7. UI — wrong-dropdown-default-selection

Issue: Both state dropdowns (Current Address and Permanent Address) are pre-selected with "Karnataka" on page load. The spec explicitly states no state should be pre-selected — the user must make an explicit choice. A user who does not notice will accidentally submit Karnataka as their state.
Expected vs actual: Expected: State dropdown shows an empty placeholder with no pre-selection. Actual: "Karnataka" pre-selected by default in both dropdowns.

## 8. UI — missing-ui-feedback-guard

Issue: When a user types an invalid pincode (e.g. "1234" or "ABCDE") in the pincode field, no inline error message appears. The spec requires an inline error to be shown before the form is submitted, giving immediate feedback to the user.
Expected vs actual: Expected: Inline error message appears next to the pincode field as soon as invalid input is detected. Actual: No inline error shown — invalid pincode is only caught on submit or silently accepted.

## 9. UI — state-not-persisted

Issue: When the "Permanent address is the same as current" checkbox is checked, the Permanent Address fields should be disabled and mirror the Current Address in real time (including if the user keeps editing Current Address). This does not happen — permanent fields stay editable and independent.
Expected vs actual: Expected: Checking the checkbox disables permanent fields and auto-fills them from current address, updating live as current address changes. Actual: Permanent fields remain editable and do not mirror current address at all.

## 10. UI — wrong-format-display

Issue: The Submitted Addresses table displays match percentage as a plain number (e.g. "100", "0") without the "%" sign. The spec explicitly states the value must be shown with a % sign (e.g. "100%", "0%").
Expected vs actual: Expected: Match % column shows values like "100%", "25%", "0%" with percent sign. Actual: Plain numbers "100", "0" displayed with no % sign.

## 11. POST /api/address — wrong-persisted-default

Issue: The spec clearly states that sameAsPermanent must default to false if it is omitted from the request body. However, when the field is omitted, the API incorrectly defaults it to true.
Expected vs actual: Expected: sameAsPermanent defaults to false when omitted. Actual: sameAsPermanent defaults to true when omitted.

## 12. POST /api/address — missing-sanitization

Issue: The API does not sanitize string inputs. Submitting HTML or script tags (e.g., <script>alert(1)</script>) in fields like city or line1 is accepted and stored directly into the database.
Expected vs actual: Expected: Input is sanitized and HTML tags are stripped or rejected. Actual: Unsanitized HTML/JS is stored, risking XSS.

## 13. UI — missing-sanitization

Issue: The Submitted Addresses table renders the line1 field for current and permanent addresses without HTML-escaping. All other fields (city, state, pincode) use escapeHtml() but line1 is directly interpolated as raw HTML, creating a stored XSS vulnerability in the UI display layer.
Expected vs actual: Expected: line1 is HTML-escaped before being rendered in the table, just like city, state and pincode. Actual: line1 is injected as raw HTML — any stored script or HTML in line1 executes in the browser when the table loads.


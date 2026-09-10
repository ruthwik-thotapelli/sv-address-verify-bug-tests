/**
 * Phase 2 — Automated regression tests for all 13 confirmed bugs.
 * Each test FAILS against the buggy app as-shipped.
 * Run:  npm test
 */

const request = require('supertest');
const path = require('path');
const fs = require('fs');
const app = require('../server');

// ── Shared fixtures ──────────────────────────────────────────────────────────

const VALID_ADDRESS = {
  line1: '12 MG Road',
  city: 'Bengaluru',
  state: 'Karnataka',
  pincode: '560001',
};

const VALID_BODY = {
  candidateId: 999,
  current: VALID_ADDRESS,
  permanent: VALID_ADDRESS,
  sameAsPermanent: false,
};

beforeEach(async () => {
  await request(app).post('/api/reset');
});

// ── Bug 1 ─ POST /api/address: wrong-status-code ─────────────────────────────
describe('Bug 1 — POST /api/address returns 200 instead of 201', () => {
  test('successful submission must return HTTP 201 Created', async () => {
    const res = await request(app).post('/api/address').send(VALID_BODY);
    // BUG: server returns 200
    expect(res.status).toBe(201);
  });
});

// ── Bug 2 ─ GET /api/address/:id: wrong-status-code ──────────────────────────
describe('Bug 2 — GET /api/address/:candidateId returns 200+null instead of 404', () => {
  test('non-existent candidateId must return HTTP 404', async () => {
    const res = await request(app).get('/api/address/99999');
    // BUG: server returns 200 with null body
    expect(res.status).toBe(404);
  });
});

// ── Bug 3 ─ POST /api/address: wrong-arithmetic ───────────────────────────────
describe('Bug 3 — matchPercent divides by 3 instead of 4 fields', () => {
  test('1 matching field out of 4 should give matchPercent = 25', async () => {
    const res = await request(app).post('/api/address').send({
      candidateId: 301,
      current:   { line1: 'A Road', city: 'CityA', state: 'Karnataka', pincode: '560001' },
      permanent: { line1: 'B Road', city: 'CityB', state: 'Karnataka', pincode: '111111' },
      sameAsPermanent: false,
    });
    // BUG: returns 33 (1/3). Correct: 25 (1/4).
    expect(res.body.matchPercent).toBe(25);
  });

  test('3 matching fields out of 4 should give matchPercent = 75', async () => {
    const res = await request(app).post('/api/address').send({
      candidateId: 302,
      current:   { line1: 'DIFFERENT', city: 'Bengaluru', state: 'Karnataka', pincode: '560001' },
      permanent: { line1: '12 MG Road', city: 'Bengaluru', state: 'Karnataka', pincode: '560001' },
      sameAsPermanent: false,
    });
    // BUG: returns 100 (3/3). Correct: 75 (3/4).
    expect(res.body.matchPercent).toBe(75);
  });
});

// ── Bug 4 ─ POST /api/address: off-by-one-boundary (pincode) ─────────────────
describe('Bug 4 — pincode regex allows wrong lengths (off-by-one boundary)', () => {
  test('pincode with 5 digits should be rejected (must be exactly 6)', async () => {
    const res = await request(app).post('/api/address').send({
      ...VALID_BODY,
      current: { ...VALID_ADDRESS, pincode: '56000' }, // 5 digits
    });
    // BUG: /^[1-9][0-9]{0,5}/ without $ anchor accepts shorter pincodes
    expect(res.status).toBe(400);
  });

  test('pincode with 7 digits should be rejected (must be exactly 6)', async () => {
    const res = await request(app).post('/api/address').send({
      ...VALID_BODY,
      current: { ...VALID_ADDRESS, pincode: '5600011' }, // 7 digits
    });
    // BUG: no $ anchor in regex lets 7-digit strings pass
    expect(res.status).toBe(400);
  });
});

// ── Bug 5 ─ POST /api/address: missing-enum-validation ───────────────────────
describe('Bug 5 — any state string accepted (no enum validation)', () => {
  test('state not in allowed list should return 400', async () => {
    const res = await request(app).post('/api/address').send({
      ...VALID_BODY,
      current: { ...VALID_ADDRESS, state: 'INVALID_STATE_XYZ' },
    });
    // BUG: no state validation, returns 200
    expect(res.status).toBe(400);
  });

  test('state "Goa" (not in list) should be rejected', async () => {
    const res = await request(app).post('/api/address').send({
      ...VALID_BODY,
      current: { ...VALID_ADDRESS, state: 'Goa' },
    });
    expect(res.status).toBe(400);
  });
});

// ── Bug 6 ─ POST /api/address: missing-required-field (candidateId) ───────────
describe('Bug 6 — missing candidateId silently defaults to 0', () => {
  test('request without candidateId should return 400', async () => {
    const { candidateId, ...bodyWithoutId } = VALID_BODY;
    const res = await request(app).post('/api/address').send(bodyWithoutId);
    // BUG: server defaults candidateId to 0 and returns 200
    expect(res.status).toBe(400);
  });

  test('candidateId=0 should be rejected (must be positive integer)', async () => {
    const res = await request(app).post('/api/address').send({
      ...VALID_BODY,
      candidateId: 0,
    });
    // BUG: candidateId=0 is stored as-is
    expect(res.status).toBe(400);
  });
});

// ── Bug 7 ─ UI: wrong-dropdown-default-selection ─────────────────────────────
describe('Bug 7 — state dropdown pre-selects "Karnataka" (no empty placeholder)', () => {
  test('populateStateDropdown should include an empty placeholder option', () => {
    const appJs = fs.readFileSync(
      path.join(__dirname, '../public/app.js'), 'utf8'
    );
    // BUG: STATES.map() creates options with no leading empty/placeholder option
    // so Karnataka (first in array) is always pre-selected
    const hasEmptyPlaceholder =
      appJs.includes('<option value="">') ||
      appJs.includes("value = ''") ||
      appJs.includes('Select state') ||
      appJs.includes('-- Select') ||
      /prepend|unshift|placeholder/i.test(appJs);
    // FAILS: no placeholder exists in current code
    expect(hasEmptyPlaceholder).toBe(true);
  });
});

// ── Bug 8 ─ UI: missing-ui-feedback-guard (inline pincode error) ──────────────
describe('Bug 8 — no inline pincode error shown before form submit', () => {
  test('app.js should attach an input/change listener to pincode for inline validation', () => {
    const appJs = fs.readFileSync(
      path.join(__dirname, '../public/app.js'), 'utf8'
    );
    // BUG: there is a #current-pincode-error element in HTML but no JS populates it
    // Spec: invalid pincode triggers inline error message before submit
    const pincodeErrorPattern =
      /current-pincode[^)]*addEventListener|current-pincode-error[^=]*=\s*['"`][^'"` ]/;
    // FAILS: no input listener on pincode, error element is never populated
    expect(pincodeErrorPattern.test(appJs)).toBe(true);
  });
});

// ── Bug 9 ─ UI: state-not-persisted (checkbox doesn't live-mirror) ────────────
describe('Bug 9 — checkbox copies once but does not live-mirror current → permanent', () => {
  test('app.js should add listeners on current fields to keep permanent in sync', () => {
    const appJs = fs.readFileSync(
      path.join(__dirname, '../public/app.js'), 'utf8'
    );
    // BUG: only "change" on the checkbox copies values — no listeners on
    // current-line1/city/state/pincode to keep permanent updated in real time
    const hasCurrentFieldSync =
      /current-line1[\s\S]{0,300}addEventListener[\s\S]{0,100}input|addEventListener[\s\S]{0,100}input[\s\S]{0,300}current-line1/.test(appJs);
    // FAILS: no per-field listeners exist
    expect(hasCurrentFieldSync).toBe(true);
  });
});

// ── Bug 10 ─ UI: wrong-format-display (% sign missing) ───────────────────────
describe('Bug 10 — matchPercent rendered without % sign in table', () => {
  test('table cell for matchPercent must append "%" to the value', () => {
    const appJs = fs.readFileSync(
      path.join(__dirname, '../public/app.js'), 'utf8'
    );
    // BUG: template literal is `${s.matchPercent}` — no % appended
    const hasPercent =
      /\$\{s\.matchPercent\}%|\$\{[^}]*matchPercent[^}]*\}%|matchPercent[^;]*\+\s*['"]%/.test(appJs);
    // FAILS: plain ${s.matchPercent} with no trailing %
    expect(hasPercent).toBe(true);
  });
});

// ── Bug 11 ─ POST /api/address: wrong-persisted-default (sameAsPermanent) ──────
describe('Bug 11 — omitting sameAsPermanent defaults to true instead of false', () => {
  test('sameAsPermanent must default to false when field is absent', async () => {
    const { sameAsPermanent, ...bodyWithoutFlag } = VALID_BODY;
    const res = await request(app).post('/api/address').send(bodyWithoutFlag);
    // BUG: server code sets sameAsPermanent = true when undefined
    expect(res.body.sameAsPermanent).toBe(false);
  });
});

// ── Bug 12 ─ POST /api/address: missing-sanitization (API stores raw HTML) ────
describe('Bug 12 — API accepts and stores raw HTML/script in input fields', () => {
  test('HTML/script payload in line1 should be rejected or sanitized', async () => {
    const xss = '<script>alert("xss")</script>';
    const res = await request(app).post('/api/address').send({
      candidateId: 601,
      current: { line1: xss, city: 'Bengaluru', state: 'Karnataka', pincode: '560001' },
      permanent: VALID_ADDRESS,
      sameAsPermanent: false,
    });
    // BUG: returns 200 and stores raw script tag
    const storedLine1 = res.body.current?.line1;
    // Either reject with 400 OR sanitize (stored value should not equal raw XSS)
    const isUnsanitized = storedLine1 === xss;
    expect(isUnsanitized).toBe(false);
  });

  test('HTML in city field should not be stored raw', async () => {
    const xss = '<img src=x onerror=alert(1)>';
    const res = await request(app).post('/api/address').send({
      candidateId: 602,
      current: { line1: '12 MG Road', city: xss, state: 'Karnataka', pincode: '560001' },
      permanent: VALID_ADDRESS,
      sameAsPermanent: false,
    });
    expect(res.body.current?.city).not.toBe(xss);
  });
});

// ── Bug 13 ─ UI: missing-sanitization (line1 not HTML-escaped in table) ───────
describe('Bug 13 — UI renders line1 as raw HTML (no escapeHtml)', () => {
  test('cur.line1 must be wrapped in escapeHtml() in renderSubmissions', () => {
    const appJs = fs.readFileSync(
      path.join(__dirname, '../public/app.js'), 'utf8'
    );
    // BUG: ${cur.line1 ?? ""} is raw; city/state/pincode use escapeHtml() but line1 does NOT
    expect(appJs).toMatch(/escapeHtml\(\s*cur\.line1/);
  });

  test('perm.line1 must be wrapped in escapeHtml() in renderSubmissions', () => {
    const appJs = fs.readFileSync(
      path.join(__dirname, '../public/app.js'), 'utf8'
    );
    expect(appJs).toMatch(/escapeHtml\(\s*perm\.line1/);
  });
});

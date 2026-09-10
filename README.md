# Address Verification Form

A full-stack Express and JavaScript address verification challenge that models a candidate registration flow with current and permanent address validation, a match percentage calculation, an HTML UI, and an automated regression test suite.

## Project Overview

This repository contains an intentionally buggy implementation of an address verification form. The app exposes a browser UI and a REST API for saving submissions and listing results. The included test suite describes the expected contract for the API and UI, including all 13 confirmed regression scenarios.

## What the App Does

- Captures a candidate ID along with current and permanent address information
- Supports a same-as-permanent checkbox that mirrors the current address into the permanent fields
- Calculates a match percentage across the four address fields: line1, city, state, and pincode
- Persists submissions in an in-memory store for the duration of the test session
- Provides a reset route for test isolation and seed reloading

## Technology Stack

- Node.js
- Express
- Jest
- Supertest
- HTML, CSS, and vanilla JavaScript

## Installation

```bash
npm install
```

## Run the App

```bash
npm start
```

The app runs locally on port 3002 by default.

## Run the Tests

```bash
npm test
```

The automated regression suite checks the API contract and UI requirements described in the tests.

## API Summary

```text
GET /api/address
GET /api/address/:candidateId
POST /api/address
POST /api/reset
```

The project expects the correct HTTP statuses, field validation, state allow-list enforcement, pincode length and regex rules, candidate ID validation, safe HTML handling, and correct UI rendering.

## Project Structure

```text
.
├── data.js
├── isolation.js
├── server.js
├── public/
│   ├── app.js
│   ├── index.html
│   └── style.css
└── tests/
    └── bugs.test.js
```

## Repository Story

This repository was built to exercise source-code inspection, failure reproduction, API verification, test authoring, and regression debugging in a VS Code workspace. It is intended to demonstrate a high-quality software QA and bug-fix workflow using real project files and test evidence.

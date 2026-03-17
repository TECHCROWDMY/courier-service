# Courier Service

A command-line application to estimate delivery costs and delivery times for Kiki's courier service.

---

## Setup
```bash
npm install
```

## Run tests
```bash
npm test
```

For coverage:
```bash
npm run test:coverage
```

## Run the app

### Part 1 — Delivery cost with offers
```bash
echo "100 3
PKG1 5 5 OFR001
PKG2 15 5 OFR002
PKG3 10 100 OFR003" | node src/cli.js
```

Expected output:
```
PKG1 0 175
PKG2 0 275
PKG3 35 665
```

### Part 2 — Delivery cost + estimated delivery time
```bash
echo "100 5
PKG1 50 30 OFR001
PKG2 75 125 OFR008
PKG3 175 100 OFR003
PKG4 110 60 OFR002
PKG5 155 95 NA
2 70 200" | node src/cli.js
```

Expected output:
```
PKG1 0 750 3.98
PKG2 0 1475 1.78
PKG3 0 2350 1.42
PKG4 105 1395 0.85
PKG5 0 2125 4.19
```

---

## Project structure
```
src/
  models/
    Package.js          - Package data model (pure data, no logic)
    Vehicle.js          - Vehicle data model (tracks availability over time)
  services/
    OfferService.js     - Validates offer codes against criteria
    CostService.js      - Calculates delivery cost and discount
    DeliveryService.js  - Shipment selection and vehicle scheduling
  config/
    offers.js           - All offer rules in one place (data-driven, extensible)
  cli.js                - Entry point: parses stdin, delegates to services, prints output
tests/
  OfferService.test.js
  CostService.test.js
  DeliveryService.test.js
```

Each layer has a single responsibility. The services do not know about the CLI. The models do not know about business rules. This makes each piece independently testable and straightforward to change without breaking anything else.

---

## Delivery cost formula
```
Delivery Cost = Base Cost + (Weight × 10) + (Distance × 5)
Discount      = Delivery Cost × (offer discount %)
Total         = Delivery Cost - Discount
```

## Shipment selection criteria (Part 2)

1. Maximise number of packages per trip
2. If tied on count — prefer the heavier combination
3. If tied on weight — prefer the combination with the shortest maximum distance (faster return)

---

## How I approached this problem

I read the spec carefully before writing any code. A few things were not immediately obvious:

**The offer criteria table** in the PDF had a rendering issue — the distance/weight columns were ambiguous. I reverse-engineered the correct bounds by working backwards from both sample outputs (PKG1 failing OFR001, PKG3 passing OFR003) until the numbers matched exactly.

**Truncation vs rounding** — the spec says "round off to 2 digits" but gives `3.456 → 3.45` as an example. That is truncation (floor), not rounding. I verified this against every expected output value before locking it in.

**Vehicle return timing** — a subtle floating point issue: `floor(2 × rawTime)` gives a different result than `2 × floor(oneWayTime)`. The spec's own walkthrough (Vehicle 02: `2 × 1.42 = 2.84`) confirms the correct approach is to floor the one-way trip first, then double it. Getting this wrong causes a cascade of incorrect times for later packages.

These are the kinds of details that only surface when you treat the sample outputs as acceptance tests rather than illustrations.

---

## Assumptions

- Offer criteria bounds are inclusive on both ends.
- `NA` and a missing offer code are both treated as "no offer" — zero discount.
- A package that individually exceeds a vehicle's max weight is skipped gracefully rather than crashing.
- Offer rules are fully data-driven in `src/config/offers.js`. Adding a new offer code requires no code changes — only a new entry in the config object.
- Input is assumed to be well-formed per the spec. Production-grade validation would be added given more time (see below).

---

## What I would do with more time

**Input validation** — currently the app trusts the input format. In production I would validate each field, give clear error messages per line, and exit with a useful message rather than a stack trace.

**Scalability of shipment selection** — the current combination search is exponential (`O(2^n)`). For a small courier service this is fine, but for hundreds of packages it would be too slow. A greedy or dynamic programming approach would scale better. I kept the current approach because it is simple, readable, and correct for the problem size — premature optimisation would have made it harder to verify.

**File input support** — accepting a file path as an argument in addition to stdin would make batch processing easier.

**Integration tests** — the current tests cover each service in isolation. I would add end-to-end tests that run the full CLI with sample inputs and assert on the printed output, catching any wiring bugs between layers.

**Richer error handling** — better messages for edge cases like all packages exceeding vehicle capacity, zero vehicles, or malformed offer codes.

---

## AI tool disclosure

Claude (Anthropic) was used for logic guidance, code structure, and identifying the floating point precision issue. All design decisions and implementation were reviewed and understood before submission.
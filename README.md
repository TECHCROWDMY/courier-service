# Courier Service

A command-line application to estimate delivery costs and times for Kiki's courier service.

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

## Project structure

```
src/
  models/
    Package.js          - Package data model
    Vehicle.js          - Vehicle data model
  services/
    OfferService.js     - Validates and applies offer codes
    CostService.js      - Calculates delivery cost and discount
    DeliveryService.js  - Shipment selection and delivery time scheduling
  config/
    offers.js           - Offer rules (extensible — add new offers here)
  cli.js                - Entry point, parses stdin and prints output
tests/
  OfferService.test.js
  CostService.test.js
  DeliveryService.test.js
```

## Delivery cost formula

```
Delivery Cost = Base Cost + (Weight × 10) + (Distance × 5)
Total = Delivery Cost - Discount
```

## Shipment selection criteria (Part 2)

1. Maximise number of packages per trip
2. If tied on count, prefer heavier total weight
3. If tied on weight, prefer shortest maximum distance

## Assumptions and tradeoffs

- Delivery time is **truncated** (floored) to 2 decimal places, not rounded. Based on the spec example: `3.456 → 3.45`.
- Offer criteria bounds are **inclusive** on both ends.
- `NA` and missing offer codes are treated identically — no discount applied.
- Packages exceeding a vehicle's max weight are skipped defensively (no crash).
- Offer rules are fully data-driven via `src/config/offers.js`. Adding a new offer requires no code changes — only a new entry in the config.

## What I'd improve with more time

- Input validation with clearer error messages per field
- Support reading from a file in addition to stdin
- Performance optimisation for large package sets (the combination search is exponential — a greedy or DP approach would scale better)
- Integration tests covering the full CLI input/output

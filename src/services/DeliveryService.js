/**
 * DeliveryService.js — Shipment Selection & Vehicle Scheduling
 *
 * This service handles everything related to Part 2 of the problem:
 * figuring out WHICH packages go on each trip, and WHEN each package arrives.
 *
 * It has two main responsibilities:
 *   1. selectShipment  — picks the best group of packages for one vehicle trip
 *   2. calculateTimes  — schedules all trips across all vehicles until every
 *                        package has been delivered
 *
 * This service does NOT know about:
 *   - The terminal (cli.js handles that)
 *   - Offer codes or discounts (OfferService handles that)
 *   - Cost calculations (CostService handles that)
 *
 * It only cares about: weights, distances, speeds, and time.
 */


/**
 * floor2(x)
 *
 * PURPOSE:
 *   Truncates a number to exactly 2 decimal places.
 *   This is NOT the same as rounding — it always cuts off, never rounds up.
 *
 * WHY TRUNCATION AND NOT ROUNDING:
 *   The spec says "round off to 2 digits" but the example proves otherwise:
 *   3.456 → 3.45 (not 3.46). That is truncation (floor), not rounding.
 *   Using Math.round() would give wrong answers that cascade into every
 *   subsequent delivery time calculation.
 *
 * HOW IT WORKS:
 *   Multiply by 100  → shifts decimal 2 places right  e.g. 1.428 → 142.8
 *   Math.floor()     → cuts everything after decimal  e.g. 142.8 → 142
 *   Divide by 100    → shifts decimal back             e.g. 142   → 1.42
 *
 * EXAMPLES:
 *   floor2(1.428)  → 1.42  (not 1.43)
 *   floor2(3.456)  → 3.45  (not 3.46)
 *   floor2(3.999)  → 3.99  (not 4.00)
 *
 * @param {number} x - The number to truncate
 * @returns {number} - The number truncated to 2 decimal places
 */
const floor2 = (x) => Math.floor(x * 100) / 100;


/**
 * getCombinations(arr, size)
 *
 * PURPOSE:
 *   Generates every possible grouping of a specific size from an array.
 *   We need this to try every possible way to load packages onto a vehicle
 *   so we can find the best combination that fits within the weight limit.
 *
 * EXAMPLE:
 *   getCombinations([A, B, C], 2)
 *   → [[A,B], [A,C], [B,C]]
 *   Every possible pair, no repeats, order doesn't matter.
 *
 * HOW IT WORKS (recursion):
 *   For each item in the array, we make a choice:
 *     INCLUDE it: take it + find (size-1) more from the rest
 *     EXCLUDE it: skip it + find (size) more from the rest
 *   Combine both results to get every possible grouping.
 *
 * BASE CASES (when to stop recursing):
 *   - size === 0 → we've picked enough items, return one empty combo [[]]
 *   - arr.length < size → not enough items left, impossible, return []
 *
 * WHY THIS IS O(2^n):
 *   For every package, we make 2 choices (include or exclude).
 *   With 5 packages that's 2^5 = 32 combinations.
 *   With 10 packages that's 2^10 = 1024 combinations.
 *   This grows exponentially — fine for small inputs, slow for large ones.
 *
 * @param {any[]} arr  - The array to generate combinations from
 * @param {number} size - How many items each combination should contain
 * @returns {any[][]} - Array of all possible combinations of the given size
 */
const getCombinations = (arr, size) => {
  // Base case 1: we need 0 more items — return one combo that is empty
  if (size === 0) return [[]];

  // Base case 2: not enough items left to form a combo of this size
  if (arr.length < size) return [];

  // Split the array: first item vs everything else
  // Example: [A, B, C] → first = A, rest = [B, C]
  const [first, ...rest] = arr;

  // INCLUDE first: find (size-1) more items from rest, then prepend first to each
  // Example: getCombinations([B,C], 1) → [[B], [C]] → [[A,B], [A,C]]
  const withFirst = getCombinations(rest, size - 1).map((c) => [first, ...c]);

  // EXCLUDE first: find (size) items from rest without using first at all
  // Example: getCombinations([B,C], 2) → [[B,C]]
  const withoutFirst = getCombinations(rest, size);

  // Combine both sets to get every possible combination
  return [...withFirst, ...withoutFirst];
};


class DeliveryService {

  /**
   * selectShipment(packages, maxWeight)
   *
   * PURPOSE:
   *   Picks the single best group of packages to load onto one vehicle for
   *   one trip. Think of it as the dispatcher deciding how to fill a van
   *   as efficiently as possible.
   *
   * SELECTION PRIORITY (in order):
   *   1. Maximum number of packages — always try to fit as many as possible
   *   2. Heaviest total weight — if count is tied, prefer the heavier group
   *   3. Shortest maximum distance — if weight is also tied, prefer the
   *      group whose furthest package is closest (faster return trip)
   *
   * HOW IT WORKS:
   *   - Starts by trying to fit ALL remaining packages (largest size first)
   *   - If nothing fits at that size, tries one fewer package
   *   - Keeps going down until it finds valid combinations
   *   - Among valid combos of the same size, sorts by weight then distance
   *   - Returns the first one after sorting (which is always the best)
   *
   * WHY COUNT DOWN (largest to smallest):
   *   The moment we find any valid combination at a given size, we know
   *   it's already the maximum possible. No larger group exists that fits.
   *   Counting up would find a single package first and return immediately,
   *   never discovering that 2 or 3 packages could also fit.
   *
   * WHAT IT RETURNS:
   *   The best array of Package objects for this trip.
   *   Returns an empty array [] if no package fits (all exceed maxWeight).
   *
   * @param {Package[]} packages  - The remaining undelivered packages
   * @param {number} maxWeight    - The vehicle's maximum weight capacity in kg
   * @returns {Package[]}         - The best group of packages for this trip
   */
  static selectShipment(packages, maxWeight) {

    // Try every possible group size, starting from largest and counting down.
    // This guarantees we always maximise the number of packages per trip.
    for (let size = packages.length; size >= 1; size--) {

      // Get every possible combination of this size, then filter out any
      // that exceed the vehicle's weight limit.
      // .reduce here sums up the total weight of each combo.
      const valid = getCombinations(packages, size).filter(
        (combo) => combo.reduce((sum, p) => sum + p.weight, 0) <= maxWeight
      );

      // If we found at least one valid combo at this size, sort and return.
      // We don't need to check smaller sizes — this is already the maximum.
      if (valid.length > 0) {

        valid.sort((a, b) => {
          // Helper: sums total weight of a combo
          const totalWeight = (combo) => combo.reduce((s, p) => s + p.weight, 0);

          // PRIORITY 2: sort by heaviest first.
          // b - a = descending order (heaviest first).
          // a - b = ascending order (lightest first) — WRONG for our needs.
          const weightDiff = totalWeight(b) - totalWeight(a);

          // If weights differ, heavier combo wins — return the difference.
          // A positive result means b comes first (heavier).
          if (weightDiff !== 0) return weightDiff;

          // PRIORITY 3: weights are tied — sort by shortest max distance first.
          // Helper: finds the furthest package distance in a combo
          const maxDist = (combo) => Math.max(...combo.map((p) => p.distance));

          // a - b = ascending order (shortest first).
          // Shorter max distance = faster return trip = more efficient.
          return maxDist(a) - maxDist(b);
        });

        // After sorting, the best shipment is always at index 0. Return it.
        return valid[0];
      }
    }

    // No valid shipment found — every package exceeds the weight limit.
    // Returning empty array instead of crashing — defensive programming.
    return [];
  }


  /**
   * calculateTimes(packages, vehicles, base)
   *
   * PURPOSE:
   *   The main delivery scheduler. Keeps assigning shipments to vehicles
   *   in a loop until every single package has been delivered.
   *   Think of it as the control tower managing all vehicles in real time.
   *
   * HOW IT WORKS:
   *   1. Pick the vehicle that becomes free soonest (lowest availableAt)
   *   2. Load it with the best possible shipment (via selectShipment)
   *   3. Calculate and record the delivery time for each package in the shipment
   *   4. Remove those packages from the waiting list
   *   5. Update the vehicle's availableAt (current time + 2 × one-way trip)
   *   6. Repeat until no packages remain
   *
   * THE RETURN TRIP:
   *   After dropping off packages, the vehicle drives back to base at the
   *   same speed. So total time away = 2 × one-way trip time.
   *   IMPORTANT: we floor the one-way time FIRST, then double it.
   *   This matches the spec's own worked example: 2 × 1.42 = 2.84 ✓
   *   NOT: floor(2 × 1.428) = floor(2.857) = 2.85 ✗
   *
   * WHY [...packages] AND NOT packages DIRECTLY:
   *   We make a copy of the packages array using the spread operator.
   *   This is because we remove packages from `remaining` as they are
   *   delivered. If we used the original array directly, cli.js would
   *   lose all its packages and print nothing at the end.
   *
   * @param {Package[]} packages  - All packages to be delivered
   * @param {Vehicle[]} vehicles  - All available vehicles
   * @param {number} base         - Base delivery cost (passed in but not used
   *                                here — kept for interface consistency)
   * @returns {{ [pkgId: string]: number }} - Map of pkgId to delivery time in hours
   *   Example: { "PKG1": 3.98, "PKG2": 1.78, "PKG3": 1.42 }
   */
  static calculateTimes(packages, vehicles, base) {

    // Make a COPY of packages — we will remove items from this as they
    // are delivered. Without the spread, we'd destroy the original array.
    const remaining = [...packages];

    // This object stores the final delivery time for each package.
    // Key = package ID, Value = delivery time in hours.
    // Example: { "PKG1": 3.98, "PKG4": 0.85 }
    const times = {};

    // Keep scheduling trips until every package has been delivered.
    while (remaining.length > 0) {

      // Pick whichever vehicle becomes free soonest.
      // reduce scans ALL vehicles and keeps track of the one with the
      // lowest availableAt seen so far — like finding the minimum value.
      // At the start all vehicles have availableAt = 0, so the first one wins.
      const vehicle = vehicles.reduce((earliest, v) =>
        v.availableAt < earliest.availableAt ? v : earliest
      );

      // Load the vehicle with the best possible shipment from remaining packages.
      const shipment = this.selectShipment(remaining, vehicle.maxWeight);

      // Safety check: if no package fits (all exceed max weight), stop.
      // Prevents an infinite loop — without this, remaining would never
      // empty and the while loop would run forever.
      if (shipment.length === 0) break;

      // Snapshot the time this trip starts — the moment this vehicle is free.
      // All delivery times in this trip are calculated from this moment.
      const currentTime = vehicle.availableAt;

      // Calculate and record the delivery time for each package in this shipment.
      for (const pkg of shipment) {

        // Delivery time = when the vehicle left + how long the drive takes.
        // Time = distance ÷ speed. Truncated to 2 decimal places.
        // Example: currentTime=0, distance=100, speed=70 → 0 + 1.42 = 1.42
        times[pkg.pkgId] = floor2(currentTime + pkg.distance / vehicle.maxSpeed);

        // Remove this package from the waiting list now that it's been assigned.
        // indexOf finds its position in the array.
        // splice(position, 1) removes exactly 1 item at that position.
        // Without this, the same packages would be assigned again on the next
        // loop iteration and the while loop would never end.
        remaining.splice(remaining.indexOf(pkg), 1);
      }

      // Calculate when this vehicle returns to base after the trip.
      // It must travel to the furthest package's destination and drive back.
      // maxDist = the longest single journey in this shipment.
      const maxDist = Math.max(...shipment.map((p) => p.distance));

      // CRITICAL: floor the one-way time FIRST, then double it.
      // This matches the spec's own calculation in the worked example.
      // e.g. 100km ÷ 70km/h = 1.428... → floor2 → 1.42
      //      return trip = 2 × 1.42 = 2.84 ✓
      // If we did floor2(2 × 1.428) = floor2(2.857) = 2.85 ✗
      // That small difference cascades into wrong times for later packages.
      const oneWayTime = floor2(maxDist / vehicle.maxSpeed);
      vehicle.availableAt = floor2(currentTime + 2 * oneWayTime);
    }

    // Return the completed map of all package delivery times.
    return times;
  }
}

module.exports = DeliveryService;
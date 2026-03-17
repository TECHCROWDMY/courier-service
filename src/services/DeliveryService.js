/**
 * Truncates a number to 2 decimal places (floor, not round).
 * Per spec: 3.456 becomes 3.45
 */
const floor2 = (x) => Math.floor(x * 100) / 100;

/**
 * Returns all combinations of a given size from an array.
 */
const getCombinations = (arr, size) => {
  if (size === 0) return [[]];
  if (arr.length < size) return [];
  const [first, ...rest] = arr;
  const withFirst = getCombinations(rest, size - 1).map((c) => [first, ...c]);
  const withoutFirst = getCombinations(rest, size);
  return [...withFirst, ...withoutFirst];
};

class DeliveryService {
  /**
   * Selects the best shipment from remaining packages for one vehicle trip.
   * Priority: (1) max packages, (2) heaviest total weight, (3) shortest max distance.
   */
  static selectShipment(packages, maxWeight) {
    for (let size = packages.length; size >= 1; size--) {
      const valid = getCombinations(packages, size).filter(
        (combo) => combo.reduce((sum, p) => sum + p.weight, 0) <= maxWeight
      );

      if (valid.length > 0) {
        valid.sort((a, b) => {
          const totalWeight = (combo) => combo.reduce((s, p) => s + p.weight, 0);
          const weightDiff = totalWeight(b) - totalWeight(a);
          if (weightDiff !== 0) return weightDiff;

          const maxDist = (combo) => Math.max(...combo.map((p) => p.distance));
          return maxDist(a) - maxDist(b);
        });

        return valid[0];
      }
    }

    return [];
  }

  /**
   * Calculates estimated delivery time for every package.
   * Vehicles are reused after returning from a delivery trip.
   */
  static calculateTimes(packages, vehicles, base) {
    const remaining = [...packages];
    const times = {};

    while (remaining.length > 0) {
      // Pick the vehicle that becomes available soonest
      const vehicle = vehicles.reduce((earliest, v) =>
        v.availableAt < earliest.availableAt ? v : earliest
      );

      const shipment = this.selectShipment(remaining, vehicle.maxWeight);
      if (shipment.length === 0) break;

      const currentTime = vehicle.availableAt;

      for (const pkg of shipment) {
        times[pkg.pkgId] = floor2(currentTime + pkg.distance / vehicle.maxSpeed);
        remaining.splice(remaining.indexOf(pkg), 1);
      }

      const maxDist = Math.max(...shipment.map((p) => p.distance));
      // Floor the one-way trip first, then double — matches spec calculation
      // e.g. 100/70 = 1.42 (floored), return = 2 * 1.42 = 2.84
      const oneWayTime = floor2(maxDist / vehicle.maxSpeed);
      vehicle.availableAt = floor2(currentTime + 2 * oneWayTime);
    }

    return times;
  }
}

module.exports = DeliveryService;

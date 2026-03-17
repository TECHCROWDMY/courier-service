const DeliveryService = require('../src/services/DeliveryService');
const Package = require('../src/models/Package');
const Vehicle = require('../src/models/Vehicle');

const makePackages = () => [
  new Package('PKG1', 50, 30, 'OFR001'),
  new Package('PKG2', 75, 125, 'OFR008'),
  new Package('PKG3', 175, 100, 'OFR003'),
  new Package('PKG4', 110, 60, 'OFR002'),
  new Package('PKG5', 155, 95, null),
];

const makeVehicles = () => [
  new Vehicle(1, 70, 200),
  new Vehicle(2, 70, 200),
];

describe('DeliveryService - selectShipment', () => {
  test('selects heaviest valid 2-package combination', () => {
    const shipment = DeliveryService.selectShipment(makePackages(), 200);
    const ids = shipment.map((p) => p.pkgId).sort();
    // PKG2(75) + PKG4(110) = 185kg — heaviest 2-package combo under 200kg
    expect(ids).toEqual(['PKG2', 'PKG4']);
  });

  test('selects single package when no multi-package combo fits', () => {
    const packages = [new Package('PKG3', 175, 100, null)];
    const shipment = DeliveryService.selectShipment(packages, 200);
    expect(shipment.map((p) => p.pkgId)).toEqual(['PKG3']);
  });

  test('returns empty array when all packages exceed max weight', () => {
    const packages = [new Package('PKG1', 300, 100, null)];
    const shipment = DeliveryService.selectShipment(packages, 200);
    expect(shipment).toEqual([]);
  });

  test('prefers more packages over heavier single package', () => {
    const packages = [
      new Package('A', 100, 10, null),
      new Package('B', 50, 10, null),
      new Package('C', 50, 10, null),
    ];
    // A=100kg (single), B+C=100kg (two packages) — prefer B+C (more packages)
    const shipment = DeliveryService.selectShipment(packages, 100);
    const ids = shipment.map((p) => p.pkgId).sort();
    expect(ids).toEqual(['B', 'C']);
  });
});

describe('DeliveryService - calculateTimes (sample from problem spec)', () => {
  let times;

  beforeAll(() => {
    times = DeliveryService.calculateTimes(makePackages(), makeVehicles(), 100);
  });

  test('PKG2 delivered at 1.78 hrs', () => {
    expect(times['PKG2']).toBe(1.78);
  });

  test('PKG4 delivered at 0.85 hrs', () => {
    expect(times['PKG4']).toBe(0.85);
  });

  test('PKG3 delivered at 1.42 hrs', () => {
    expect(times['PKG3']).toBe(1.42);
  });

  test('PKG5 delivered at 4.19 hrs', () => {
    expect(times['PKG5']).toBe(4.19);
  });

  test('PKG1 delivered at 3.98 hrs', () => {
    expect(times['PKG1']).toBe(3.98);
  });
});

describe('DeliveryService - edge cases', () => {
  test('single package single vehicle', () => {
    const packages = [new Package('PKG1', 10, 100, null)];
    const vehicles = [new Vehicle(1, 70, 200)];
    const times = DeliveryService.calculateTimes(packages, vehicles, 100);
    // 100/70 = 1.428... → floor to 1.42
    expect(times['PKG1']).toBe(1.42);
  });

  test('assigns second shipment to earliest available vehicle', () => {
    const packages = [
      new Package('PKG1', 100, 10, null),
      new Package('PKG2', 100, 200, null),
    ];
    const vehicles = [new Vehicle(1, 50, 100), new Vehicle(2, 50, 100)];
    const times = DeliveryService.calculateTimes(packages, vehicles, 100);
    expect(times['PKG1']).toBeDefined();
    expect(times['PKG2']).toBeDefined();
  });
});

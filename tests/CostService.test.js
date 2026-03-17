const CostService = require('../src/services/CostService');
const Package = require('../src/models/Package');

describe('CostService', () => {
  describe('calculate', () => {
    test('computes base cost correctly: base + (weight*10) + (distance*5)', () => {
      const pkg = new Package('PKG1', 5, 5, 'OFR001');
      const result = CostService.calculate(pkg, 100);
      // 100 + (5*10) + (5*5) = 175
      expect(result.cost).toBe(175);
    });

    test('applies no discount when offer criteria not met', () => {
      const pkg = new Package('PKG1', 5, 5, 'OFR001');
      const result = CostService.calculate(pkg, 100);
      expect(result.discount).toBe(0);
      expect(result.total).toBe(175);
    });

    test('applies no discount when offer code is invalid', () => {
      const pkg = new Package('PKG2', 15, 5, 'OFR002');
      const result = CostService.calculate(pkg, 100);
      // 100 + (15*10) + (5*5) = 275
      expect(result.discount).toBe(0);
      expect(result.total).toBe(275);
    });

    test('applies 5% discount for OFR003 when criteria met', () => {
      const pkg = new Package('PKG3', 10, 100, 'OFR003');
      const result = CostService.calculate(pkg, 100);
      // cost = 100 + 100 + 500 = 700, discount = 5% of 700 = 35
      expect(result.cost).toBe(700);
      expect(result.discount).toBe(35);
      expect(result.total).toBe(665);
    });

    test('applies 7% discount for OFR002 when criteria met', () => {
      const pkg = new Package('PKG4', 110, 60, 'OFR002');
      const result = CostService.calculate(pkg, 100);
      // cost = 100 + 1100 + 300 = 1500, discount = 7% of 1500 = 105
      expect(result.discount).toBe(105);
      expect(result.total).toBe(1395);
    });

    test('handles no offer code', () => {
      const pkg = new Package('PKG1', 5, 5, null);
      const result = CostService.calculate(pkg, 100);
      expect(result.discount).toBe(0);
      expect(result.total).toBe(175);
    });
  });
});

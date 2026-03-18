const OfferService = require('../src/services/OfferService');
const Package = require('../src/models/Package');

describe('OfferService', () => {
  describe('getDiscountPct', () => {
    test('returns 0 when offer code is null', () => {
      const pkg = new Package('PKG1', 5, 5, null);
      expect(OfferService.getDiscountPct(pkg)).toBe(0);
    });

    test('returns 0 when offer code is not found', () => {
      const pkg = new Package('PKG1', 5, 5, 'INVALID');
      expect(OfferService.getDiscountPct(pkg)).toBe(0);
    });

    test('OFR001 - returns 0 when weight is below minimum (70kg)', () => {
      const pkg = new Package('PKG1', 5, 5, 'OFR001');
      expect(OfferService.getDiscountPct(pkg)).toBe(0);
    });

    test('OFR001 - returns 0 when distance exceeds maximum (200km)', () => {
      const pkg = new Package('PKG1', 100, 250, 'OFR001');
      expect(OfferService.getDiscountPct(pkg)).toBe(0);
    });

    test('OFR001 - returns 10 when criteria met', () => {
      const pkg = new Package('PKG1', 100, 100, 'OFR001');
      expect(OfferService.getDiscountPct(pkg)).toBe(10);
    });

    test('OFR002 - returns 0 when weight is below minimum (100kg)', () => {
      const pkg = new Package('PKG2', 15, 5, 'OFR002');
      expect(OfferService.getDiscountPct(pkg)).toBe(0);
    });

    test('OFR002 - returns 0 when distance exceeds maximum (150km)', () => {
      const pkg = new Package('PKG2', 110, 200, 'OFR002');
      expect(OfferService.getDiscountPct(pkg)).toBe(0);
    });

    test('OFR002 - returns 7 when criteria met', () => {
      const pkg = new Package('PKG4', 110, 60, 'OFR002');
      expect(OfferService.getDiscountPct(pkg)).toBe(7);
    });

    test('OFR003 - returns 5 when criteria met', () => {
      const pkg = new Package('PKG3', 10, 100, 'OFR003');
      expect(OfferService.getDiscountPct(pkg)).toBe(5);
    });

    test('OFR003 - returns 0 when distance is below minimum (50km)', () => {
      const pkg = new Package('PKG3', 10, 30, 'OFR003');
      expect(OfferService.getDiscountPct(pkg)).toBe(0);
    });

    test('OFR003 - returns 0 when distance exceeds maximum (250km)', () => {
      const pkg = new Package('PKG3', 10, 300, 'OFR003');
      expect(OfferService.getDiscountPct(pkg)).toBe(0);
    });
  });
});
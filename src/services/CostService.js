const OfferService = require('./OfferService');

class CostService {
  /**
   * Calculates delivery cost, discount, and total for a package.
   * Formula: base + (weight * 10) + (distance * 5)
   */
  static calculate(pkg, base) {
    const cost = base + (pkg.weight * 10) + (pkg.distance * 5);
    const discountPct = OfferService.getDiscountPct(pkg);
    const discount = Math.round((discountPct / 100) * cost * 100) / 100;
    const total = Math.round((cost - discount) * 100) / 100;
    return { cost, discount, total };
  }
}

module.exports = CostService;

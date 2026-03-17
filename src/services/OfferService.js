const OFFERS = require('../config/offers');

class OfferService {
  /**
   * Returns the discount percentage for a package based on its offer code.
   * Returns 0 if the offer code is missing, invalid, or criteria not met.
   */
  static getDiscountPct(pkg) {
    if (!pkg.offerCode) return 0;

    const offer = OFFERS[pkg.offerCode];
    if (!offer) return 0;

    const weightOk = pkg.weight >= offer.minWeight && pkg.weight <= offer.maxWeight;
    const distOk = pkg.distance >= offer.minDistance && pkg.distance <= offer.maxDistance;

    return weightOk && distOk ? offer.discountPct : 0;
  }
}

module.exports = OfferService;

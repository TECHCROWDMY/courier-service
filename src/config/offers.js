/**
 * Offer rules configuration.
 * To add a new offer, simply add a new entry here.
 * No changes needed in any service.
 */
const OFFERS = {
  OFR001: {
    discountPct: 10,
    minWeight: 70,
    maxWeight: 200,
    minDistance: 0,
    maxDistance: 199.99,
  },
  OFR002: {
    discountPct: 7,
    minWeight: 100,
    maxWeight: 250,
    minDistance: 50,
    maxDistance: 250,
  },
  OFR003: {
    discountPct: 5,
    minWeight: 10,
    maxWeight: 150,
    minDistance: 10,
    maxDistance: 150,
  },
};

module.exports = OFFERS;

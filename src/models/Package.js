class Package {
  constructor(pkgId, weight, distance, offerCode = null) {
    this.pkgId = pkgId;
    this.weight = weight;
    this.distance = distance;
    this.offerCode = offerCode;
  }
}

module.exports = Package;

// ===================================================
// Vehicle Model
// availableAt - tracks what time a vehicle returns to base after a trip — so we know when it can be loaded again for the next delivery.
// ====================================================

class Vehicle {
  constructor(vehicleId, maxSpeed, maxWeight) {
    this.vehicleId = vehicleId;
    this.maxSpeed = maxSpeed;
    this.maxWeight = maxWeight;
    this.availableAt = 0;
  }
}

module.exports = Vehicle;

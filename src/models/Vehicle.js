class Vehicle {
  constructor(vehicleId, maxSpeed, maxWeight) {
    this.vehicleId = vehicleId;
    this.maxSpeed = maxSpeed;
    this.maxWeight = maxWeight;
    this.availableAt = 0;
  }
}

module.exports = Vehicle;

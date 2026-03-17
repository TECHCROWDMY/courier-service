const Package = require('./models/Package');
const Vehicle = require('./models/Vehicle');
const CostService = require('./services/CostService');
const DeliveryService = require('./services/DeliveryService');

function parseInput(input) {
  const lines = input.trim().split('\n');
  const [base, n] = lines[0].trim().split(/\s+/);
  const numPackages = parseInt(n);
  const packages = [];

  for (let i = 1; i <= numPackages; i++) {
    const parts = lines[i].trim().split(/\s+/);
    if (parts.length < 3) {
      throw new Error(`Invalid package input on line ${i + 1}`);
    }
    packages.push(
      new Package(
        parts[0],
        parseFloat(parts[1]),
        parseFloat(parts[2]),
        parts[3] && parts[3] !== 'NA' ? parts[3] : null
      )
    );
  }

  let vehicles = null;
  const vehicleLine = lines[numPackages + 1];
  if (vehicleLine && vehicleLine.trim()) {
    const [numV, speed, maxW] = vehicleLine.trim().split(/\s+/);
    vehicles = Array.from(
      { length: parseInt(numV) },
      (_, i) => new Vehicle(i + 1, parseFloat(speed), parseFloat(maxW))
    );
  }

  return { base: parseFloat(base), packages, vehicles };
}

function run(input) {
  const { base, packages, vehicles } = parseInput(input);

  const costs = {};
  for (const pkg of packages) {
    costs[pkg.pkgId] = CostService.calculate(pkg, base);
  }

  if (vehicles) {
    const times = DeliveryService.calculateTimes(packages, vehicles, base);
    for (const pkg of packages) {
      const { discount, total } = costs[pkg.pkgId];
      console.log(`${pkg.pkgId} ${discount} ${total} ${times[pkg.pkgId]}`);
    }
  } else {
    for (const pkg of packages) {
      const { discount, total } = costs[pkg.pkgId];
      console.log(`${pkg.pkgId} ${discount} ${total}`);
    }
  }
}

// Only run when executed directly, not when required in tests
if (require.main === module) {
  let input = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (chunk) => { input += chunk; });
  process.stdin.on('end', () => {
    try {
      run(input);
    } catch (err) {
      console.error(`Error: ${err.message}`);
      process.exit(1);
    }
  });
}

module.exports = { run, parseInput };

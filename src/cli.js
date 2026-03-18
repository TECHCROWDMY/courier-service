/**
 * cli.js — Entry Point
 *
 * This is the first file that runs when you execute: node src/cli.js
 *
 * Its only job is to:
 *   1. Read raw text from the terminal (stdin)
 *   2. Parse that text into Package and Vehicle objects (parseInput)
 *   3. Pass those objects to the right services (CostService, DeliveryService)
 *   4. Print the results to the terminal (console.log)
 *
 * This file knows about everything — models, services, input, output.
 * But it does NO calculations itself. It just coordinates.
 *
 * Think of it as the receptionist of the app:
 *   - Takes the order from the customer (terminal input)
 *   - Passes it to the kitchen (services)
 *   - Brings the food back to the customer (printed output)
 */

const Package = require('./models/Package');
const Vehicle = require('./models/Vehicle');
const CostService = require('./services/CostService');
const DeliveryService = require('./services/DeliveryService');


/**
 * parseInput(input)
 *
 * PURPOSE:
 *   Converts a raw multi-line string (from the terminal) into structured
 *   Package and Vehicle objects that the services can work with.
 *
 * WHAT IT RECEIVES:
 *   A single string containing the entire terminal input. Example:
 *
 *     "100 5\nPKG1 50 30 OFR001\nPKG2 75 125 OFR008\n2 70 200"
 *
 * WHAT IT RETURNS:
 *   An object with three properties:
 *     - base      {number}          — the base delivery cost (e.g. 100)
 *     - packages  {Package[]}       — array of Package objects
 *     - vehicles  {Vehicle[]|null}  — array of Vehicle objects, or null if
 *                                     no vehicle line was provided (Part 1 only)
 *
 * WHY IT EXISTS:
 *   Keeps all input-parsing logic in one place. The services never have to
 *   know or care about the input format — they just receive clean objects.
 *
 * @param {string} input - Raw text from stdin
 * @returns {{ base: number, packages: Package[], vehicles: Vehicle[]|null }}
 */
function parseInput(input) {

  // Split the entire input string into individual lines.
  // .trim() removes any leading/trailing whitespace or newlines.
  // .split('\n') cuts at every line break, giving us an array of strings.
  // Example: "100 3\nPKG1 5 5" → ["100 3", "PKG1 5 5"]
  const lines = input.trim().split('\n');

  // Read the first line to get base cost and number of packages.
  // .split(/\s+/) splits on ANY whitespace (handles single or multiple spaces).
  // Destructuring [ base, n ] grabs the first and second values by position.
  // Example: "100 3" → base = "100", n = "3"
  const [base, n] = lines[0].trim().split(/\s+/);
  const numPackages = parseInt(n); // convert string "3" to number 3
  const packages = [];

  // Loop through each package line.
  // Starts at line index 1 (line 0 was the base/count line).
  // Stops after reading numPackages lines.
  for (let i = 1; i <= numPackages; i++) {

    // Split each package line into individual parts by whitespace.
    // Example: "PKG1 5 5 OFR001" → ["PKG1", "5", "5", "OFR001"]
    const parts = lines[i].trim().split(/\s+/);

    // Defensive check: every package line needs at least 3 parts
    // (id, weight, distance). If not, something is wrong with the input.
    // Throwing an error here gives a clear message instead of silently
    // producing wrong results or crashing with a confusing error later.
    if (parts.length < 3) {
      throw new Error(`Invalid package input on line ${i + 1}`);
    }

    // Create a Package object from the parts and add it to the array.
    // parts[0] = package id   e.g. "PKG1"
    // parts[1] = weight       e.g. "5"   → parseFloat converts to number 5
    // parts[2] = distance     e.g. "5"   → parseFloat converts to number 5
    // parts[3] = offer code   e.g. "OFR001" or "NA" or undefined
    //
    // The offer code logic:
    //   - If parts[3] exists AND it's not the string "NA" → use it as the offer code
    //   - Otherwise → set to null (meaning no discount applies)
    packages.push(
      new Package(
        parts[0],
        parseFloat(parts[1]),
        parseFloat(parts[2]),
        parts[3] && parts[3] !== 'NA' ? parts[3] : null
      )
    );
  }

  // Check if there is a vehicle line after all the package lines.
  // This line is optional — it only appears in Part 2 input.
  // Example vehicle line: "2 70 200" → 2 vehicles, speed 70 km/h, max weight 200 kg
  let vehicles = null;
  const vehicleLine = lines[numPackages + 1];

  if (vehicleLine && vehicleLine.trim()) {

    // Split the vehicle line into its three values.
    // numV  = number of vehicles  e.g. "2" → 2
    // speed = max speed in km/h   e.g. "70"
    // maxW  = max weight in kg    e.g. "200"
    const [numV, speed, maxW] = vehicleLine.trim().split(/\s+/);

    // Array.from creates an array of a given length and populates it.
    // { length: 2 } means "make an array with 2 slots".
    // The second argument is a function called for each slot:
    //   _ = the slot value (unused, we don't need it)
    //   i = the index (0, 1, 2...) — used to give each vehicle a unique ID (i+1)
    // Result: [Vehicle(1, 70, 200), Vehicle(2, 70, 200)]
    vehicles = Array.from(
      { length: parseInt(numV) },
      (_, i) => new Vehicle(i + 1, parseFloat(speed), parseFloat(maxW))
    );
  }

  return { base: parseFloat(base), packages, vehicles };
}


/**
 * run(input)
 *
 * PURPOSE:
 *   The main controller of the application.
 *   Calls parseInput to get structured data, then delegates to the correct
 *   services, and prints the final output to the terminal.
 *
 * PART 1 (no vehicle line in input):
 *   Prints: pkgId  discount  total
 *   Example output: PKG1 0 175
 *
 * PART 2 (vehicle line present in input):
 *   Prints: pkgId  discount  total  deliveryTime
 *   Example output: PKG1 0 750 3.98
 *
 * WHY COSTS ARE CALCULATED FIRST FOR ALL PACKAGES:
 *   We store all costs upfront in an object keyed by pkgId.
 *   This way, when we loop through packages to print output,
 *   we can instantly look up any package's cost without recalculating.
 *
 * @param {string} input - Raw text from stdin, passed in from the stdin handler below
 * @returns {void} - Output is printed directly to the terminal via console.log
 */
function run(input) {

  // Parse the raw input string into usable objects.
  // Destructuring pulls base, packages, vehicles out of the returned object.
  const { base, packages, vehicles } = parseInput(input);

  // Calculate and store the cost result for every package upfront.
  // costs is a plain object used as a lookup map: { "PKG1": {cost, discount, total}, ... }
  // CostService.calculate returns { cost, discount, total } for each package.
  const costs = {};
  for (const pkg of packages) {
    costs[pkg.pkgId] = CostService.calculate(pkg, base);
  }

  if (vehicles) {
    // PART 2: vehicle line was present — calculate and print delivery times too.
    // DeliveryService.calculateTimes returns { pkgId: deliveryTime } for all packages.
    const times = DeliveryService.calculateTimes(packages, vehicles, base);

    for (const pkg of packages) {
      // Pull discount and total out of the pre-calculated costs object.
      const { discount, total } = costs[pkg.pkgId];

      // Template literal (backticks) builds the output string with variables injected.
      // times[pkg.pkgId] looks up this package's delivery time from the times map.
      // Example output line: "PKG1 0 750 3.98"
      console.log(`${pkg.pkgId} ${discount} ${total} ${times[pkg.pkgId]}`);
    }

  } else {
    // PART 1: no vehicle line — print cost only, no delivery time.
    for (const pkg of packages) {
      const { discount, total } = costs[pkg.pkgId];

      // Example output line: "PKG1 0 175"
      console.log(`${pkg.pkgId} ${discount} ${total}`);
    }
  }
}


/**
 * STDIN HANDLER — reads terminal input and triggers run()
 *
 * WHY THIS BLOCK EXISTS:
 *   Node.js does not read from the terminal automatically.
 *   We have to explicitly listen for incoming data using process.stdin.
 *
 * HOW IT WORKS:
 *   Terminal input arrives in chunks (pieces), not all at once.
 *   We collect every chunk into the `input` variable as it arrives.
 *   When the user is done (presses Ctrl+D or the pipe ends), the 'end'
 *   event fires — at that point the full input is ready and we call run().
 *
 * WHY THE if (require.main === module) CHECK:
 *   This is critical. It means:
 *     "Only run this block if this file was executed directly from the terminal."
 *
 *   When the test files import cli.js using require('../src/cli.js'),
 *   this block is SKIPPED. Without this check, the app would start listening
 *   to the terminal every time a test ran — and hang forever waiting for input.
 *
 *   require.main === module is Node's built-in way to detect:
 *     "Was I run directly (node src/cli.js)? Or was I imported by someone else?"
 */
if (require.main === module) {
  let input = '';

  // Tell Node to give us text (utf8), not raw binary bytes.
  process.stdin.setEncoding('utf8');

  // 'data' event fires every time a chunk of text arrives.
  // We keep adding each chunk to the input string.
  process.stdin.on('data', (chunk) => {
    input += chunk;
  });

  // 'end' event fires when all input has been received.
  // Now the full input string is ready — pass it to run().
  process.stdin.on('end', () => {
    try {
      run(input);
    } catch (err) {
      // If anything goes wrong (bad input format, etc.),
      // print a clean human-readable error message instead of a raw stack trace.
      // process.exit(1) signals to the terminal that something went wrong.
      // Exit code 0 = success, exit code 1 = failure (standard convention).
      console.error(`Error: ${err.message}`);
      process.exit(1);
    }
  });
}


/**
 * EXPORTS
 *
 * Makes run() and parseInput() available when this file is imported elsewhere.
 * The test files use this to call these functions directly without going
 * through the terminal.
 *
 * Example in a test file:
 *   const { run, parseInput } = require('../src/cli');
 */
module.exports = { run, parseInput };
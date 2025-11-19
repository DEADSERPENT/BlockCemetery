// Historical Data Migration Tool
// Imports existing cemetery data into the blockchain system

const hre = require("hardhat");
const fs = require("fs");
const csv = require("csv-parser");
const path = require("path");

/**
 * Migration tool for importing historical cemetery data
 * Supports CSV, JSON formats
 */
class HistoricalDataMigrator {
  constructor(contractAddress) {
    this.contractAddress = contractAddress;
    this.contract = null;
    this.stats = {
      graveyardsImported: 0,
      gravesImported: 0,
      errors: [],
      skipped: [],
    };
  }

  async initialize() {
    console.log("\n🔄 Initializing Historical Data Migrator...\n");

    const CemeteryManager = await hre.ethers.getContractFactory("CemeteryManagerEnhanced");
    this.contract = CemeteryManager.attach(this.contractAddress);

    console.log("✅ Connected to contract:", this.contractAddress);
    console.log("");
  }

  /**
   * Parse CSV file with graveyard data
   */
  async parseGraveyardsCSV(filePath) {
    return new Promise((resolve, reject) => {
      const graveyards = [];

      fs.createReadStream(filePath)
        .pipe(csv())
        .on("data", (row) => {
          graveyards.push({
            name: row.name || row.Name,
            location: row.location || row.Location || row.address,
            owner: row.owner || row.Owner,
            numPlots: parseInt(row.numPlots || row.total_plots || row.capacity || 100),
            latitude: parseFloat(row.latitude || row.lat || 0) * 1e6,
            longitude: parseFloat(row.longitude || row.lng || row.lon || 0) * 1e6,
            boundary: row.boundary || row.geojson || "",
            totalArea: parseInt(row.area || row.total_area || 0),
          });
        })
        .on("end", () => resolve(graveyards))
        .on("error", reject);
    });
  }

  /**
   * Parse CSV file with grave data
   */
  async parseGravesCSV(filePath) {
    return new Promise((resolve, reject) => {
      const graves = [];

      fs.createReadStream(filePath)
        .pipe(csv())
        .on("data", (row) => {
          graves.push({
            graveyardId: parseInt(row.graveyardId || row.cemetery_id || 1),
            price: hre.ethers.parseEther(row.price || "0.1"),
            latitude: parseFloat(row.latitude || row.lat || 0) * 1e6,
            longitude: parseFloat(row.longitude || row.lng || row.lon || 0) * 1e6,
            accuracy: parseInt(row.accuracy || 10),
            locationHash: row.locationHash || row.ipfs_hash || `QmHash${Date.now()}`,
            deceasedName: row.deceased_name || row.name || "",
            burialDate: row.burial_date ? new Date(row.burial_date).getTime() / 1000 : 0,
            reserved: row.reserved === "true" || row.status === "reserved",
          });
        })
        .on("end", () => resolve(graves))
        .on("error", reject);
    });
  }

  /**
   * Import graveyards in batches
   */
  async importGraveyards(graveyards, batchSize = 10) {
    console.log(`📋 Importing ${graveyards.length} graveyards...`);

    for (let i = 0; i < graveyards.length; i += batchSize) {
      const batch = graveyards.slice(i, i + batchSize);

      for (const gy of batch) {
        try {
          console.log(`  Adding: ${gy.name}...`);

          const tx = await this.contract.addGraveyardWithGPS(
            gy.owner || (await hre.ethers.getSigners())[0].address,
            gy.name,
            gy.location,
            gy.numPlots,
            Math.floor(gy.latitude),
            Math.floor(gy.longitude),
            gy.boundary,
            gy.totalArea
          );

          await tx.wait();
          this.stats.graveyardsImported++;
          console.log(`    ✅ Added graveyard ID: ${this.stats.graveyardsImported}`);
        } catch (error) {
          console.log(`    ❌ Error: ${error.message}`);
          this.stats.errors.push({
            type: "graveyard",
            name: gy.name,
            error: error.message,
          });
        }
      }

      // Delay between batches to avoid rate limiting
      if (i + batchSize < graveyards.length) {
        console.log(`  ⏳ Waiting before next batch...`);
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
  }

  /**
   * Import graves in batches
   */
  async importGraves(graves, batchSize = 10) {
    console.log(`\n📋 Importing ${graves.length} graves...`);

    for (let i = 0; i < graves.length; i += batchSize) {
      const batch = graves.slice(i, i + batchSize);

      for (const grave of batch) {
        try {
          console.log(`  Adding grave for graveyard ${grave.graveyardId}...`);

          const tx = await this.contract.addGraveWithGPS(
            grave.graveyardId,
            grave.price,
            grave.locationHash,
            Math.floor(grave.latitude),
            Math.floor(grave.longitude),
            grave.accuracy
          );

          await tx.wait();
          this.stats.gravesImported++;
          console.log(`    ✅ Added grave ID: ${this.stats.gravesImported}`);
        } catch (error) {
          console.log(`    ❌ Error: ${error.message}`);
          this.stats.errors.push({
            type: "grave",
            graveyardId: grave.graveyardId,
            error: error.message,
          });
        }
      }

      if (i + batchSize < graves.length) {
        console.log(`  ⏳ Waiting before next batch...`);
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
  }

  /**
   * Generate migration report
   */
  generateReport() {
    console.log("\n📊 Migration Report");
    console.log("=".repeat(50));
    console.log(`✅ Graveyards Imported: ${this.stats.graveyardsImported}`);
    console.log(`✅ Graves Imported: ${this.stats.gravesImported}`);
    console.log(`❌ Errors: ${this.stats.errors.length}`);

    if (this.stats.errors.length > 0) {
      console.log("\n⚠️  Errors:");
      this.stats.errors.forEach((err, idx) => {
        console.log(`  ${idx + 1}. [${err.type}] ${err.name || err.graveyardId}: ${err.error}`);
      });
    }

    // Save report to file
    const report = {
      timestamp: new Date().toISOString(),
      stats: this.stats,
    };

    fs.writeFileSync(
      path.join(__dirname, "../migration-report.json"),
      JSON.stringify(report, null, 2)
    );

    console.log("\n📄 Full report saved to: migration-report.json\n");
  }
}

/**
 * Main migration function
 */
async function main() {
  console.log("🏛️  Cemetery Historical Data Migration Tool");
  console.log("=".repeat(50));

  // Get contract address from environment or use default
  const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";

  const migrator = new HistoricalDataMigrator(CONTRACT_ADDRESS);
  await migrator.initialize();

  // Check if data files exist
  const graveyardsFile = path.join(__dirname, "../data/historical-graveyards.csv");
  const gravesFile = path.join(__dirname, "../data/historical-graves.csv");

  if (!fs.existsSync(graveyardsFile)) {
    console.log("❌ Graveyards CSV file not found!");
    console.log(`   Expected: ${graveyardsFile}`);
    console.log("\n📝 Create a CSV file with these columns:");
    console.log("   name, location, owner, numPlots, latitude, longitude, boundary, area");
    return;
  }

  // Import graveyards
  console.log("\n📂 Reading graveyard data...");
  const graveyards = await migrator.parseGraveyardsCSV(graveyardsFile);
  console.log(`   Found ${graveyards.length} graveyards\n`);

  await migrator.importGraveyards(graveyards);

  // Import graves if file exists
  if (fs.existsSync(gravesFile)) {
    console.log("\n📂 Reading grave data...");
    const graves = await migrator.parseGravesCSV(gravesFile);
    console.log(`   Found ${graves.length} graves\n`);

    await migrator.importGraves(graves);
  } else {
    console.log("\n⚠️  No graves CSV file found, skipping grave import");
    console.log(`   Create: ${gravesFile}`);
  }

  // Generate report
  migrator.generateReport();

  console.log("✅ Migration completed!\n");
}

// Run migration
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { HistoricalDataMigrator };

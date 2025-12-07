/**
 * Migration Script for CemeteryManager V1 to V2
 *
 * This script helps migrate data from the old CemeteryManagerEnhanced contract
 * to the new gas-optimized CemeteryManagerV2 contract.
 *
 * Key Changes in V2:
 * 1. IPFS hashes stored as bytes32 instead of strings
 * 2. Boundary GeoJSON stored off-chain (only hash on-chain)
 * 3. Analytics counters tracked in state (no loops)
 * 4. Indexed events for better off-chain querying
 */

const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("=".repeat(60));
  console.log("Cemetery Manager V1 to V2 Migration Script");
  console.log("=".repeat(60));
  console.log("");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");
  console.log("");

  // Step 1: Deploy V2 Contract
  console.log("Step 1: Deploying CemeteryManagerV2...");
  const CemeteryManagerV2 = await ethers.getContractFactory("CemeteryManagerV2");
  const cemeteryV2 = await CemeteryManagerV2.deploy();
  await cemeteryV2.waitForDeployment();

  const v2Address = await cemeteryV2.getAddress();
  console.log("✅ CemeteryManagerV2 deployed to:", v2Address);
  console.log("");

  // Save deployment info
  const deploymentInfo = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: (await ethers.provider.getNetwork()).chainId.toString(),
    contractAddress: v2Address,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    version: "v2.0.0",
    improvements: [
      "bytes32 for IPFS hashes (gas savings)",
      "Off-chain boundary storage (80% gas reduction)",
      "O(1) analytics queries (no loops)",
      "Indexed events for efficient querying",
      "Client-side encryption support"
    ]
  };

  const deploymentPath = path.join(__dirname, "..", "deployment-v2-info.json");
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("✅ Deployment info saved to:", deploymentPath);
  console.log("");

  // Step 2: Check for existing V1 contract
  console.log("Step 2: Checking for existing V1 contract...");
  const existingDeploymentPath = path.join(__dirname, "..", "deployment-info.json");

  if (!fs.existsSync(existingDeploymentPath)) {
    console.log("⚠️  No existing V1 deployment found.");
    console.log("📝 This appears to be a fresh deployment.");
    console.log("");
    printNextSteps(v2Address);
    return;
  }

  const v1Deployment = JSON.parse(fs.readFileSync(existingDeploymentPath, "utf8"));
  const v1Address = v1Deployment.contractAddress;

  console.log("✅ Found V1 contract at:", v1Address);
  console.log("");

  // Step 3: Fetch V1 Data
  console.log("Step 3: Fetching data from V1 contract...");
  const CemeteryManagerV1 = await ethers.getContractFactory("CemeteryManagerEnhanced");
  const cemeteryV1 = CemeteryManagerV1.attach(v1Address);

  let totalGraveyards, totalGraves;

  try {
    totalGraveyards = Number(await cemeteryV1.getTotalGraveyards());
    totalGraves = Number(await cemeteryV1.getTotalGraves());

    console.log(`Found ${totalGraveyards} graveyards and ${totalGraves} graves in V1`);
    console.log("");

    if (totalGraveyards === 0 && totalGraves === 0) {
      console.log("⚠️  V1 contract has no data to migrate.");
      console.log("📝 You can start using V2 directly.");
      console.log("");
      printNextSteps(v2Address);
      return;
    }
  } catch (error) {
    console.error("❌ Error fetching V1 data:", error.message);
    console.log("⚠️  Unable to connect to V1 contract. Is it deployed on this network?");
    console.log("");
    printNextSteps(v2Address);
    return;
  }

  // Step 4: Migrate Graveyards
  console.log("Step 4: Migrating graveyards...");
  console.log("⚠️  IMPORTANT: This requires manual intervention!");
  console.log("");
  console.log("V1 stores boundary as raw GeoJSON string.");
  console.log("V2 stores boundary as IPFS hash (bytes32).");
  console.log("");
  console.log("Migration Steps:");
  console.log("1. For each graveyard in V1:");
  console.log("   - Extract the GeoJSON boundary");
  console.log("   - Upload to IPFS");
  console.log("   - Get the IPFS hash");
  console.log("   - Convert to bytes32");
  console.log("   - Create graveyard in V2 with bytes32 hash");
  console.log("");

  // Generate migration data file
  const migrationData = {
    v1Contract: v1Address,
    v2Contract: v2Address,
    totalGraveyards,
    totalGraves,
    graveyards: [],
  };

  for (let i = 1; i <= totalGraveyards; i++) {
    try {
      const graveyard = await cemeteryV1.getGraveyard(i);

      migrationData.graveyards.push({
        id: i,
        owner: graveyard.owner,
        name: graveyard.name,
        location: graveyard.location,
        numPlots: Number(graveyard.numPlots),
        gps: {
          latitude: Number(graveyard.gpsCenterPoint.latitude),
          longitude: Number(graveyard.gpsCenterPoint.longitude),
        },
        boundaryGeoJSON: graveyard.boundary, // Raw GeoJSON to upload to IPFS
        totalArea: Number(graveyard.totalArea),
        imageHash: graveyard.imageHash,
        action: "NEEDS_BOUNDARY_UPLOAD",
      });

      console.log(`✅ Extracted graveyard ${i}: ${graveyard.name}`);
    } catch (error) {
      console.error(`❌ Error extracting graveyard ${i}:`, error.message);
    }
  }

  const migrationDataPath = path.join(__dirname, "..", "migration-data.json");
  fs.writeFileSync(migrationDataPath, JSON.stringify(migrationData, null, 2));
  console.log("");
  console.log("✅ Migration data saved to:", migrationDataPath);
  console.log("");

  // Step 5: Print Manual Migration Instructions
  console.log("=".repeat(60));
  console.log("📋 MANUAL MIGRATION STEPS");
  console.log("=".repeat(60));
  console.log("");
  console.log("1. Review migration-data.json");
  console.log("");
  console.log("2. For each graveyard:");
  console.log("   a. Upload boundary GeoJSON to IPFS:");
  console.log("      POST /api/ipfs/v2/upload-boundary");
  console.log("      { geoJSON: <boundary from migration-data.json> }");
  console.log("");
  console.log("   b. Get the bytes32 hash from response");
  console.log("");
  console.log("   c. Call V2 contract:");
  console.log("      cemeteryV2.addGraveyardWithGPS(");
  console.log("        owner, name, location, numPlots,");
  console.log("        latitude, longitude,");
  console.log("        boundaryHash, // bytes32 from IPFS");
  console.log("        totalArea");
  console.log("      )");
  console.log("");
  console.log("3. Use the automated script:");
  console.log("   node scripts/executeMigration.js");
  console.log("");
  console.log("4. Update frontend to use V2 contract address:");
  console.log("   - Update frontend/.env");
  console.log("   - VITE_CONTRACT_ADDRESS=" + v2Address);
  console.log("");
  console.log("5. Test the migration:");
  console.log("   - Verify all graveyards migrated correctly");
  console.log("   - Check analytics functions work");
  console.log("   - Test new features (client-side encryption)");
  console.log("");

  printNextSteps(v2Address);
}

function printNextSteps(contractAddress) {
  console.log("=".repeat(60));
  console.log("🚀 NEXT STEPS");
  console.log("=".repeat(60));
  console.log("");
  console.log("1. Update environment variables:");
  console.log("   VITE_CONTRACT_ADDRESS=" + contractAddress);
  console.log("");
  console.log("2. Install frontend dependencies for new features:");
  console.log("   cd frontend");
  console.log("   npm install bs58  # For IPFS CID conversion");
  console.log("");
  console.log("3. Update frontend to use V2 utilities:");
  console.log("   - Import from utils/ipfsHelpers.js");
  console.log("   - Import from utils/encryption.js");
  console.log("");
  console.log("4. Test gas savings:");
  console.log("   npx hardhat test test/CemeteryManagerV2.test.js");
  console.log("");
  console.log("5. Verify contract (optional):");
  console.log("   npx hardhat verify --network <network> " + contractAddress);
  console.log("");
  console.log("6. Deploy The Graph subgraph for efficient querying");
  console.log("");
  console.log("=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

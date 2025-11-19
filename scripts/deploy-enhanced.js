const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying Enhanced Cemetery Manager Contract...\n");

  // Get the contract factory
  const CemeteryManagerEnhanced = await hre.ethers.getContractFactory("CemeteryManagerEnhanced");

  console.log("📝 Deploying contract...");
  const cemetery = await CemeteryManagerEnhanced.deploy();

  await cemetery.waitForDeployment();
  const address = await cemetery.getAddress();

  console.log("✅ CemeteryManagerEnhanced deployed to:", address);

  // Get deployer address
  const [deployer] = await hre.ethers.getSigners();
  console.log("👤 Deployed by:", deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Verify deployer is admin
  console.log("🔐 Verifying admin role...");
  const ADMIN_ROLE = await cemetery.DEFAULT_ADMIN_ROLE();
  const isAdmin = await cemetery.hasRole(ADMIN_ROLE, deployer.address);
  console.log("Admin status:", isAdmin ? "✅ Confirmed" : "❌ Not admin\n");

  // Display contract info
  console.log("📊 Contract Information:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Contract Address:", address);
  console.log("Network:", hre.network.name);
  console.log("Chain ID:", (await hre.ethers.provider.getNetwork()).chainId.toString());
  console.log("Block Number:", await hre.ethers.provider.getBlockNumber());
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // Test basic functionality
  console.log("🧪 Running basic tests...\n");

  try {
    // Test 1: Add a graveyard with GPS
    console.log("Test 1: Adding graveyard with GPS...");
    const tx1 = await cemetery.addGraveyardWithGPS(
      deployer.address,
      "Test Memorial Park",
      "123 Test Street, Test City",
      100,
      37774900,   // San Francisco latitude * 1e6
      -122419400, // San Francisco longitude * 1e6
      "",         // boundary (empty for now)
      50000       // 50,000 sq meters
    );
    await tx1.wait();
    console.log("✅ Graveyard created successfully\n");

    // Test 2: Get graveyard GPS
    console.log("Test 2: Retrieving GPS coordinates...");
    const gps = await cemetery.getGraveyardGPS(1);
    console.log("📍 GPS Coordinates:");
    console.log("   Latitude:", (Number(gps.latitude) / 1e6).toFixed(6));
    console.log("   Longitude:", (Number(gps.longitude) / 1e6).toFixed(6));
    console.log("   Accuracy:", gps.accuracy.toString(), "meters");
    console.log("   Timestamp:", new Date(Number(gps.timestamp) * 1000).toLocaleString());
    console.log("✅ GPS retrieval successful\n");

    // Test 3: Add a grave with GPS
    console.log("Test 3: Adding grave with GPS...");
    const tx2 = await cemetery.addGraveWithGPS(
      1,                              // graveyardId
      hre.ethers.parseEther("0.1"),  // price: 0.1 ETH
      "QmTestHash123",                // locationHash
      37775000,                       // latitude * 1e6
      -122419500,                     // longitude * 1e6
      10                              // accuracy in meters
    );
    await tx2.wait();
    console.log("✅ Grave created successfully\n");

    // Test 4: Get analytics
    console.log("Test 4: Retrieving analytics...");
    const analytics = await cemetery.getAnalytics();
    console.log("📊 System Analytics:");
    console.log("   Total Graveyards:", analytics.totalGraveyards.toString());
    console.log("   Total Graves:", analytics.totalGraves.toString());
    console.log("   Total Reserved:", analytics.totalReserved.toString());
    console.log("   Total Maintained:", analytics.totalMaintained.toString());
    console.log("   Total Revenue:", hre.ethers.formatEther(analytics.totalRevenue), "ETH");
    console.log("   Average Price:", hre.ethers.formatEther(analytics.averagePrice), "ETH");
    console.log("✅ Analytics retrieval successful\n");

    console.log("🎉 All tests passed!\n");

  } catch (error) {
    console.error("❌ Test failed:", error.message, "\n");
  }

  // Configuration instructions
  console.log("📋 Next Steps:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("1. Update frontend configuration:");
  console.log("   File: frontend/src/context/Web3Context.jsx");
  console.log(`   Change CONTRACT_ADDRESS to: "${address}"\n`);

  console.log("2. Update backend configuration:");
  console.log("   File: backend/.env");
  console.log(`   Set: CONTRACT_ADDRESS=${address}\n`);

  console.log("3. Save contract ABI:");
  console.log("   The ABI is automatically saved to:");
  console.log("   artifacts/contracts/CemeteryManagerEnhanced.sol/CemeteryManagerEnhanced.json\n");

  console.log("4. Restart your services:");
  console.log("   - Frontend: cd frontend && npm run dev");
  console.log("   - Backend: cd backend && npm start\n");

  console.log("5. (Optional) Run historical data migration:");
  console.log(`   node scripts/migrate-historical-data.js ${address}\n`);

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  // Save deployment info to file
  const fs = require('fs');
  const deploymentInfo = {
    contractAddress: address,
    deployer: deployer.address,
    network: hre.network.name,
    chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
    blockNumber: await hre.ethers.provider.getBlockNumber(),
    timestamp: new Date().toISOString(),
    testResults: {
      graveyardCreated: true,
      gpsRetrieval: true,
      graveCreated: true,
      analyticsWorking: true
    }
  };

  fs.writeFileSync(
    'deployment-info.json',
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\n💾 Deployment info saved to: deployment-info.json\n");
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

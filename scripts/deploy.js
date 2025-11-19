const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

// Auto-update contract addresses in env files
function updateEnvFiles(contractAddress, network) {
  const envNetwork = network === 'hardhat' || network === 'localhost' ? 'development' : 'production';

  const files = [
    { path: path.join(__dirname, '..', 'frontend', `.env.${envNetwork}`), key: 'VITE_CONTRACT_ADDRESS' },
    { path: path.join(__dirname, '..', 'backend', `.env.${envNetwork}`), key: 'CONTRACT_ADDRESS' },
    { path: path.join(__dirname, '..', 'frontend', '.env'), key: 'VITE_CONTRACT_ADDRESS' },
    { path: path.join(__dirname, '..', 'backend', '.env'), key: 'CONTRACT_ADDRESS' }
  ];

  files.forEach(file => {
    if (fs.existsSync(file.path)) {
      let content = fs.readFileSync(file.path, 'utf8');
      const pattern = new RegExp(`${file.key}=.*`);
      if (pattern.test(content)) {
        content = content.replace(pattern, `${file.key}=${contractAddress}`);
        fs.writeFileSync(file.path, content);
        console.log(`  Updated: ${path.relative(process.cwd(), file.path)}`);
      }
    }
  });
}

async function main() {
  console.log("Deploying CemeteryManager contract...");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH");

  // Deploy CemeteryManager
  const CemeteryManager = await hre.ethers.getContractFactory("CemeteryManager");
  const cemeteryManager = await CemeteryManager.deploy();

  await cemeteryManager.waitForDeployment();

  const contractAddress = await cemeteryManager.getAddress();
  console.log("CemeteryManager deployed to:", contractAddress);

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    contractAddress: contractAddress,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    blockNumber: await hre.ethers.provider.getBlockNumber()
  };

  console.log("\n=== Deployment Info ===");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Verify on Etherscan if not local network
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("\nWaiting for block confirmations...");
    await cemeteryManager.deploymentTransaction().wait(6);

    console.log("\nVerifying contract on Etherscan...");
    try {
      await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: [],
      });
      console.log("Contract verified successfully!");
    } catch (error) {
      console.log("Error verifying contract:", error.message);
    }
  }

  // Example: Add a test graveyard (only on local/testnet)
  if (hre.network.name === "localhost" || hre.network.name === "hardhat") {
    console.log("\n=== Adding Test Graveyard ===");
    const tx = await cemeteryManager.addGraveyard(
      deployer.address,
      "Green Valley Memorial Park",
      "123 Cemetery Road, Springfield",
      100
    );
    await tx.wait();
    console.log("Test graveyard added!");

    // Add some test graves
    console.log("\n=== Adding Test Graves ===");
    const prices = [
      hre.ethers.parseEther("0.5"),
      hre.ethers.parseEther("0.7"),
      hre.ethers.parseEther("1.0"),
    ];
    const hashes = [
      "QmTestHash1_PlotA1",
      "QmTestHash2_PlotA2",
      "QmTestHash3_PlotA3"
    ];

    const addGravesTx = await cemeteryManager.addGravesBatch(1, prices, hashes);
    await addGravesTx.wait();
    console.log("Test graves added!");

    const totalGraves = await cemeteryManager.getTotalGraves();
    console.log("Total graves created:", totalGraves.toString());
  }

  // Auto-update environment files
  console.log("\n=== Updating Environment Files ===");
  updateEnvFiles(contractAddress, hre.network.name);

  console.log("\n=== Deployment Complete ===");
  console.log("Contract Address:", contractAddress);
  console.log("\nRestart your services to use the new contract!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

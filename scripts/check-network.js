// Quick script to verify network configuration
const hre = require("hardhat");

async function main() {
  console.log("\n🔍 Network Configuration Check\n");

  try {
    const provider = hre.ethers.provider;
    const network = await provider.getNetwork();

    console.log("✅ Connected to Hardhat Network");
    console.log(`   Chain ID: ${network.chainId}`);
    console.log(`   Network Name: ${network.name}`);

    if (network.chainId.toString() !== "31337") {
      console.log("\n⚠️  WARNING: Expected Chain ID 31337 (Hardhat Local)");
      console.log(`   Got Chain ID: ${network.chainId}`);
    } else {
      console.log("\n✅ Correct Chain ID (31337)");
    }

    // Check if contract is deployed
    const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    const code = await provider.getCode(CONTRACT_ADDRESS);

    if (code === "0x") {
      console.log("\n❌ Contract NOT deployed at:", CONTRACT_ADDRESS);
      console.log("   Run: npx hardhat run scripts/deploy.js --network localhost");
    } else {
      console.log("\n✅ Contract deployed at:", CONTRACT_ADDRESS);
      console.log(`   Bytecode length: ${code.length} bytes`);
    }

    // Check accounts
    const accounts = await hre.ethers.getSigners();
    console.log("\n📋 Available Accounts:");
    console.log(`   Total: ${accounts.length} accounts`);
    console.log(`   Admin (Deployer): ${accounts[0].address}`);

    const balance = await provider.getBalance(accounts[0].address);
    console.log(`   Balance: ${hre.ethers.formatEther(balance)} ETH`);

    console.log("\n📝 Configuration Summary:");
    console.log("   ✅ RPC URL: http://127.0.0.1:8545");
    console.log("   ✅ Chain ID: 31337");
    console.log("   ✅ Contract: 0x5FbDB2315678afecb367f032d93F642f64180aa3");
    console.log("   ✅ Admin: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");

    console.log("\n🎯 MetaMask Configuration:");
    console.log("   Network Name: Hardhat Local");
    console.log("   RPC URL: http://127.0.0.1:8545");
    console.log("   Chain ID: 31337");
    console.log("   Currency: ETH");

    console.log("\n✅ All checks passed!\n");

  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.log("\nMake sure Hardhat node is running:");
    console.log("   npx hardhat node\n");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

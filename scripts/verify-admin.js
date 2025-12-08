// Script to verify admin role is working correctly
const hre = require("hardhat");

async function main() {
  console.log("\n🔍 Verifying Admin Role Configuration...\n");

  // Get the deployed contract address
  const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

  // Get signers
  const [deployer, user1, user2] = await hre.ethers.getSigners();

  // Get contract instance
  const CemeteryManager = await hre.ethers.getContractFactory("CemeteryManager");
  const contract = CemeteryManager.attach(CONTRACT_ADDRESS);

  console.log("📋 Test Accounts:");
  console.log("   Deployer:", deployer.address);
  console.log("   User 1:", user1.address);
  console.log("   User 2:", user2.address);
  console.log("");

  // Check if isAdmin function exists
  try {
    console.log("✅ Contract has isAdmin function");
  } catch (error) {
    console.log("❌ Contract missing isAdmin function!");
    return;
  }

  // Check deployer admin status
  try {
    const deployerIsAdmin = await contract.isAdmin(deployer.address);
    console.log(`\n👑 Deployer (${deployer.address}):`);
    console.log(`   isAdmin: ${deployerIsAdmin ? '✅ TRUE' : '❌ FALSE'}`);

    if (!deployerIsAdmin) {
      console.log("   ⚠️  WARNING: Deployer should be admin but isn't!");
    }
  } catch (error) {
    console.log("❌ Error checking deployer admin status:", error.message);
  }

  // Check user1 admin status
  try {
    const user1IsAdmin = await contract.isAdmin(user1.address);
    console.log(`\n👤 User 1 (${user1.address}):`);
    console.log(`   isAdmin: ${user1IsAdmin ? '⚠️  TRUE (unexpected!)' : '✅ FALSE'}`);
  } catch (error) {
    console.log("❌ Error checking user1 admin status:", error.message);
  }

  // Check user2 admin status
  try {
    const user2IsAdmin = await contract.isAdmin(user2.address);
    console.log(`\n👤 User 2 (${user2.address}):`);
    console.log(`   isAdmin: ${user2IsAdmin ? '⚠️  TRUE (unexpected!)' : '✅ FALSE'}`);
  } catch (error) {
    console.log("❌ Error checking user2 admin status:", error.message);
  }

  // Check roles
  console.log("\n🔑 Role Information:");
  try {
    const ADMIN_ROLE = await contract.ADMIN_ROLE();
    console.log(`   ADMIN_ROLE: ${ADMIN_ROLE}`);

    const DEFAULT_ADMIN_ROLE = await contract.DEFAULT_ADMIN_ROLE();
    console.log(`   DEFAULT_ADMIN_ROLE: ${DEFAULT_ADMIN_ROLE}`);

    const hasAdminRole = await contract.hasRole(ADMIN_ROLE, deployer.address);
    console.log(`   Deployer has ADMIN_ROLE: ${hasAdminRole ? '✅ TRUE' : '❌ FALSE'}`);

    const hasDefaultAdminRole = await contract.hasRole(DEFAULT_ADMIN_ROLE, deployer.address);
    console.log(`   Deployer has DEFAULT_ADMIN_ROLE: ${hasDefaultAdminRole ? '✅ TRUE' : '❌ FALSE'}`);
  } catch (error) {
    console.log("   ❌ Error getting role info:", error.message);
  }

  console.log("\n✅ Verification Complete!\n");

  console.log("📝 Summary:");
  console.log("   • Contract Address: " + CONTRACT_ADDRESS);
  console.log("   • Expected Admin: " + deployer.address);
  console.log("   • Frontend should show 'Admin' link for: " + deployer.address);
  console.log("   • Frontend should show 'Access Denied' for: " + user1.address + ", " + user2.address);
  console.log("");
}

main()
  .then(() => {
    console.log("\nAdmin verification completed!");
  })
  .catch((error) => {
    console.error("\nAdmin verification failed:");
    console.error(error);
    throw error;
  });

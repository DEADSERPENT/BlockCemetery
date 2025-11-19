const fs = require('fs');
const path = require('path');

/**
 * Updates contract address in all environment files after deployment
 * Usage: node scripts/update-contract-address.js <new_address> [network]
 */

const NEW_ADDRESS = process.argv[2];
const NETWORK = process.argv[3] || 'development';

if (!NEW_ADDRESS) {
  console.error('Usage: node scripts/update-contract-address.js <contract_address> [network]');
  console.error('  network: development (default) or production');
  process.exit(1);
}

// Validate address format
if (!/^0x[a-fA-F0-9]{40}$/.test(NEW_ADDRESS)) {
  console.error('Invalid Ethereum address format');
  process.exit(1);
}

const files = [
  {
    path: path.join(__dirname, '..', 'frontend', `.env.${NETWORK}`),
    pattern: /VITE_CONTRACT_ADDRESS=.*/,
    replacement: `VITE_CONTRACT_ADDRESS=${NEW_ADDRESS}`
  },
  {
    path: path.join(__dirname, '..', 'backend', `.env.${NETWORK}`),
    pattern: /CONTRACT_ADDRESS=.*/,
    replacement: `CONTRACT_ADDRESS=${NEW_ADDRESS}`
  },
  {
    path: path.join(__dirname, '..', 'frontend', '.env'),
    pattern: /VITE_CONTRACT_ADDRESS=.*/,
    replacement: `VITE_CONTRACT_ADDRESS=${NEW_ADDRESS}`
  },
  {
    path: path.join(__dirname, '..', 'backend', '.env'),
    pattern: /CONTRACT_ADDRESS=.*/,
    replacement: `CONTRACT_ADDRESS=${NEW_ADDRESS}`
  }
];

console.log(`\nUpdating contract address to: ${NEW_ADDRESS}`);
console.log(`Environment: ${NETWORK}\n`);

let updated = 0;
let skipped = 0;

files.forEach(file => {
  if (fs.existsSync(file.path)) {
    let content = fs.readFileSync(file.path, 'utf8');
    if (file.pattern.test(content)) {
      content = content.replace(file.pattern, file.replacement);
      fs.writeFileSync(file.path, content);
      console.log(`✅ Updated: ${path.relative(process.cwd(), file.path)}`);
      updated++;
    } else {
      console.log(`⚠️  Pattern not found: ${path.relative(process.cwd(), file.path)}`);
      skipped++;
    }
  } else {
    console.log(`⏭️  Skipped (not found): ${path.relative(process.cwd(), file.path)}`);
    skipped++;
  }
});

console.log(`\n✅ Updated ${updated} files, skipped ${skipped}`);
console.log('\nRemember to restart your services after updating!');

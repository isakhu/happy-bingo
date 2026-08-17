const crypto=require('crypto');
const fs=require('fs');
const privateKeyPath=process.env.HAPPY_BINGO_PRIVATE_KEY_FILE;
const privateKeyPem=process.env.HAPPY_BINGO_PRIVATE_KEY || (privateKeyPath && fs.readFileSync(privateKeyPath,'utf8'));
const machineId=process.argv[2];
const expiresAt=process.argv[3] || '';
if(!machineId || !privateKeyPem){
  console.error('Usage: set HAPPY_BINGO_PRIVATE_KEY or HAPPY_BINGO_PRIVATE_KEY_FILE, then: node tools/generate-license.cjs HB-XXXXXXXXXXXXXXX [YYYY-MM-DD]');
  process.exit(1);
}
const payload={product:'Happy Bingo',machineId,issuedAt:new Date().toISOString(),expiresAt:expiresAt?new Date(`${expiresAt}T23:59:59.999Z`).toISOString():''};
const body=Buffer.from(JSON.stringify(payload));
const signature=crypto.sign(null,body,crypto.createPrivateKey(privateKeyPem));
const key=`HBG1.${body.toString('base64url')}.${signature.toString('base64url')}`;
console.log(`\nMachine ID : ${machineId}\nLicense key: ${key}\n${expiresAt?`Expires    : ${expiresAt}\n`:''}`);

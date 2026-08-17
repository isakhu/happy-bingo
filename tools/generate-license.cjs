const crypto=require('crypto');
const SECRET='HAPPY-BINGO-2026-SELLER-KEY';
const id=process.argv[2];
if(!id){console.error('Usage: node tools/generate-license.cjs HB-XXXXXXXXXXXXXXX');process.exit(1)}
const key='HBG-'+crypto.createHash('sha256').update(id+'|'+SECRET).digest('hex').slice(0,16).toUpperCase();
console.log('\nMachine ID : '+id+'\nLicense key: '+key+'\n');

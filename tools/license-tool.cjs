#!/usr/bin/env node
// PRIVATE SALES TOOL. Never ship this file or the private signing key.
const crypto = require('node:crypto');
const fs = require('node:fs');

const [, , command, ...args] = process.argv;

function usage() {
  console.log('Usage:\n  node tools/license-tool.cjs genkeys <private.pem> <public.pem>\n  node tools/license-tool.cjs genlicense <private.pem> <customerId> [expiry YYYY-MM-DD]');
}

function genKeys(privatePath, publicPath) {
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 3072 });
  fs.writeFileSync(privatePath, privateKey.export({ type: 'pkcs8', format: 'pem' }));
  fs.writeFileSync(publicPath, publicKey.export({ type: 'spki', format: 'pem' }));
  console.log(`Created ${privatePath} and ${publicPath}. Keep the private key offline.`);
}

function genLicense(privatePath, customerId, expiry) {
  const privateKey = crypto.createPrivateKey(fs.readFileSync(privatePath, 'utf8'));
  const payload = { v: 1, product: 'happy-bingo', customerId, expiry: expiry || null, issued: new Date().toISOString() };
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.sign('sha256', Buffer.from(encoded), privateKey).toString('base64url');
  console.log(`${encoded}.${signature}`);
}

if (command === 'genkeys' && args.length >= 2) genKeys(args[0], args[1]);
else if (command === 'genlicense' && args.length >= 2) genLicense(args[0], args[1], args[2]);
else usage();

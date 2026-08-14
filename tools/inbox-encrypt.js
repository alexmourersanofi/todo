#!/usr/bin/env node
/*
 * Encrypt a batch of todo items to a browser's inbox public key and write (or
 * append to) inbox.json in the repo root.
 *
 * This repo is public. Anything committed here is world-readable, so the batch
 * is encrypted: a random AES-256-GCM key encrypts the payload, and that key is
 * wrapped with RSA-OAEP-SHA256 to the target browser's public key. Only the
 * browser holding the matching private key can open it.
 *
 *   node tools/inbox-encrypt.js <public-key.jwk.json> <batch.json> [inbox.json]
 *
 * batch.json is a plain { "items": [ ... ] } in the app's item shape.
 * inbox.json defaults to ./inbox.json and is appended to if it exists.
 *
 * Note: inbox.json is intentionally NOT covered by .gitignore's *.json rule —
 * it holds only ciphertext and has to be committed to reach the browser. The
 * plaintext batch file you pass in IS ignored. Never commit that one.
 */
'use strict';
const fs = require('fs');
const crypto = require('crypto');

const [pubPath, batchPath, outPath = 'inbox.json'] = process.argv.slice(2);
if (!pubPath || !batchPath) {
  console.error('usage: node tools/inbox-encrypt.js <public-key.jwk.json> <batch.json> [inbox.json]');
  process.exit(2);
}

const jwk = JSON.parse(fs.readFileSync(pubPath, 'utf8'));
if (jwk.kty !== 'RSA' || !jwk.n || !jwk.e) {
  console.error('That does not look like an RSA public JWK (need kty, n, e).');
  process.exit(2);
}
const batch = JSON.parse(fs.readFileSync(batchPath, 'utf8'));
const items = Array.isArray(batch) ? batch : batch.items;
if (!Array.isArray(items) || !items.length) {
  console.error('The batch file needs a non-empty "items" array.');
  process.exit(2);
}

const pub = crypto.createPublicKey({ key: jwk, format: 'jwk' });

/* An optional replaceSections list lets a batch correct an earlier one: named
   top-level sections are removed before the merge. Without it a batch can only
   ever add, so a mistake would be stuck in the browser forever. */
const replaceSections = Array.isArray(batch.replaceSections) ? batch.replaceSections : undefined;
const payload = Buffer.from(JSON.stringify({ v: 1, items, replaceSections }), 'utf8');
if (replaceSections) console.log(`will replace section(s): ${replaceSections.join(', ')}`);
const aesKey = crypto.randomBytes(32);
const iv = crypto.randomBytes(12);
const c = crypto.createCipheriv('aes-256-gcm', aesKey, iv);
/* WebCrypto expects the GCM tag appended to the ciphertext. */
const ct = Buffer.concat([c.update(payload), c.final(), c.getAuthTag()]);

const wrapped = crypto.publicEncrypt(
  { key: pub, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' },
  aesKey
);

const envelope = {
  id: 'inb-' + crypto.randomBytes(8).toString('hex'),
  alg: 'RSA-OAEP-256+A256GCM',
  count: items.length,
  key: wrapped.toString('base64'),
  iv: iv.toString('base64'),
  ct: ct.toString('base64')
};

let inbox = { version: 1, envelopes: [] };
if (fs.existsSync(outPath)) {
  try {
    const prev = JSON.parse(fs.readFileSync(outPath, 'utf8'));
    if (Array.isArray(prev.envelopes)) inbox = prev;
  } catch (e) {
    console.error(`${outPath} exists but is not readable JSON — refusing to clobber it.`);
    process.exit(1);
  }
}
inbox.envelopes.push(envelope);

/* Keep the file from growing without bound. A browser records which envelopes
   it has already merged, so old ones are dead weight once collected. */
const KEEP = 20;
if (inbox.envelopes.length > KEEP) {
  const dropped = inbox.envelopes.length - KEEP;
  inbox.envelopes = inbox.envelopes.slice(-KEEP);
  console.log(`dropped ${dropped} envelope(s) older than the last ${KEEP}`);
}

fs.writeFileSync(outPath, JSON.stringify(inbox, null, 2) + '\n');
console.log(`${items.length} item(s) encrypted into ${outPath} as ${envelope.id}`);
console.log(`${inbox.envelopes.length} envelope(s) in the inbox. Commit and push it.`);

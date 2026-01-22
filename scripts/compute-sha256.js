/*
  Usage: node scripts/compute-sha256.js "path/to/artifact" "another-path"
  Outputs JSON array to stdout: [{ path, sha256, size }]
*/
const fs = require('fs');
const crypto = require('crypto');
const globby = require('globby');

async function main() {
  const patterns = process.argv.slice(2);
  if (!patterns.length) {
    console.error('Usage: node scripts/compute-sha256.js <glob> [<glob>...]');
    process.exit(1);
  }

  const paths = await globby(patterns, { onlyFiles: true });
  const results = [];
  for (const p of paths) {
    const buf = fs.readFileSync(p);
    const hash = crypto.createHash('sha256').update(buf).digest('hex');
    results.push({ path: p, sha256: hash, size: buf.length });
  }
  console.log(JSON.stringify(results, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});

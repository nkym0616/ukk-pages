import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
const root = path.resolve("dist-pages");
for (const folder of ["api"])
  fs.rmSync(path.join(root, folder), { recursive: true, force: true });
fs.writeFileSync(path.join(root, ".nojekyll"), "");
const files = fs
  .readdirSync(root, { recursive: true })
  .filter((f) => fs.statSync(path.join(root, f)).isFile());
for (const file of files) {
  assert(!/\.(map|sql|env|log)$/.test(file), `Unsafe artifact: ${file}`);
  const content = fs.readFileSync(path.join(root, file));
  for (const key of ["GOOGLE_CLIENT_SECRET", "DATABASE_URL", "GH_TOKEN"]) {
    const secret = process.env[key];
    if (secret && secret.length > 10)
      assert(
        !content.includes(Buffer.from(secret)),
        `Protected value found in ${file}`,
      );
  }
  assert(
    !/GOCSPX-[A-Za-z0-9_-]{16,}|mysql:\/\/|-----BEGIN (?:RSA )?PRIVATE KEY-----/.test(
      content.toString(),
    ),
    `Secret pattern in ${file}`,
  );
}
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
assert(html.includes("/ukk-pages/assets/"), "Pages asset paths not ready");
fs.writeFileSync(path.join(root, "404.html"), html);
console.log(
  `Pages artifacts verified: ${files.length} files, no protected values, no source maps or server settings.`,
);

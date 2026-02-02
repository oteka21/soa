/**
 * Wrapper to run drizzle-kit introspect without path/space issues.
 * Use: node scripts/drizzle-introspect.cjs
 */
const path = require("path");
const fs = require("fs");
const { spawnSync } = require("child_process");

function loadEnv(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const eq = trimmed.indexOf("=");
        if (eq > 0) {
          const key = trimmed.slice(0, eq).trim();
          const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
          if (key && value !== undefined) process.env[key] = value;
        }
      }
    }
  } catch (_) {}
}

loadEnv(path.resolve(process.cwd(), ".env"));
loadEnv(path.resolve(process.cwd(), ".env.local"));

const cwd = process.cwd();
const nodeModules = path.join(cwd, "node_modules");

function findDrizzleKitBin() {
  const pkgJsonPath = path.join(nodeModules, "drizzle-kit", "package.json");
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, "utf8"));
    const bin = pkg.bin;
    if (!bin) return null;
    const binRel = typeof bin === "string" ? bin : bin["drizzle-kit"] || bin["drizzle-kit.js"];
    if (!binRel) return null;
    const binPath = path.resolve(path.dirname(pkgJsonPath), binRel);
    if (fs.existsSync(binPath)) return binPath;
    const altPath = path.join(path.dirname(pkgJsonPath), "dist", path.basename(binRel));
    if (fs.existsSync(altPath)) return altPath;
    return null;
  } catch {
    return null;
  }
}

let binPath = findDrizzleKitBin();
if (!binPath) {
  const pnpmPkg = path.join(nodeModules, ".pnpm");
  if (fs.existsSync(pnpmPkg)) {
    const dirs = fs.readdirSync(pnpmPkg);
    for (const d of dirs) {
      if (d.startsWith("drizzle-kit@")) {
        const candidate = path.join(pnpmPkg, d, "node_modules", "drizzle-kit");
        const pkgJson = path.join(candidate, "package.json");
        if (fs.existsSync(pkgJson)) {
          try {
            const pkg = JSON.parse(fs.readFileSync(pkgJson, "utf8"));
            const bin = pkg.bin && (typeof pkg.bin === "string" ? pkg.bin : pkg.bin["drizzle-kit"]);
            if (bin) {
              const bp = path.join(candidate, bin);
              if (fs.existsSync(bp)) {
                binPath = bp;
                break;
              }
              const bpDist = path.join(candidate, "dist", path.basename(bin));
              if (fs.existsSync(bpDist)) {
                binPath = bpDist;
                break;
              }
            }
          } catch (_) {}
        }
      }
    }
  }
}

if (!binPath) {
  console.error("drizzle-kit not found. Run: pnpm install");
  process.exit(1);
}

const result = spawnSync(process.execPath, [binPath, "introspect"], {
  stdio: "inherit",
  cwd,
  env: process.env,
});

process.exit(result.status ?? 1);

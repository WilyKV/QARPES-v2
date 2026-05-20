import esbuild from "esbuild";

// Build main server bundle
await esbuild.build({
  entryPoints: ["server/index.ts"],
  bundle: true,
  platform: "node",
  target: "node22",
  format: "esm",
  outfile: "dist/server/index.js",
  packages: "external",
  external: ["./vite.js", "./viteDev.js"],
  banner: {
    js: [
      'import { createRequire } from "module";',
      "const require = createRequire(import.meta.url);",
      'import { fileURLToPath } from "url";',
      'import { dirname } from "path";',
      "const __filename = fileURLToPath(import.meta.url);",
      "const __dirname = dirname(__filename);",
    ].join("\n"),
  },
});

// Transpile vite.ts and viteDev.ts separately (loaded dynamically)
for (const entry of ["server/vite.ts", "server/viteDev.ts"]) {
  await esbuild.build({
    entryPoints: [entry],
    bundle: false,
    platform: "node",
    target: "node22",
    format: "esm",
    outdir: "dist/server",
  });
}

console.log("Backend build complete -> dist/server/");

// Génère les icônes PWA depuis assets/icon.svg : `node scripts/generate-icons.mjs`
import sharp from "sharp";
import { readFile } from "node:fs/promises";

const svg = await readFile(new URL("../assets/icon.svg", import.meta.url));
const out = (name) => new URL(`../public/icons/${name}`, import.meta.url).pathname;

for (const [name, size] of [
  ["icon-192.png", 192],
  ["icon-512.png", 512],
  ["apple-touch-icon.png", 180],
]) {
  await sharp(svg, { density: 384 }).resize(size, size).png().toFile(out(name));
}

// Version "maskable" : motif réduit pour rester dans la zone de sécurité de 80 %.
const glyph = await sharp(svg, { density: 384 }).resize(360, 360).png().toBuffer();
await sharp({ create: { width: 512, height: 512, channels: 4, background: "#0b0b12" } })
  .composite([{ input: glyph, gravity: "centre" }])
  .png()
  .toFile(out("icon-maskable-512.png"));
console.log("Icônes générées dans public/icons");

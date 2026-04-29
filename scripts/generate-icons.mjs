import sharp from "sharp";
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "../public");

// SVG without external fonts - embed base shapes only
const svg512 = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <clipPath id="r"><rect width="512" height="512" rx="102"/></clipPath>
    <linearGradient id="bg" x1="0" y1="0" x2="0.3" y2="1">
      <stop offset="0%" stop-color="#1a3d2e"/>
      <stop offset="50%" stop-color="#0f2419"/>
      <stop offset="100%" stop-color="#071510"/>
    </linearGradient>
    <linearGradient id="line" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#c9a656" stop-opacity="0"/>
      <stop offset="30%" stop-color="#c9a656" stop-opacity="1"/>
      <stop offset="70%" stop-color="#c9a656" stop-opacity="1"/>
      <stop offset="100%" stop-color="#c9a656" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <g clip-path="url(#r)">
    <rect width="512" height="512" fill="url(#bg)"/>
    <!-- 金L字フレーム -->
    <g stroke="#c9a656" stroke-width="4" fill="none" stroke-linecap="square" opacity="0.9">
      <path d="M 60 108 L 60 60 L 108 60"/>
      <path d="M 404 60 L 452 60 L 452 108"/>
      <path d="M 60 404 L 60 452 L 108 452"/>
      <path d="M 404 452 L 452 452 L 452 404"/>
    </g>
    <!-- 装飾ライン -->
    <rect x="156" y="148" width="200" height="1.5" rx="0.75" fill="url(#line)" opacity="0.7"/>
    <rect x="156" y="322" width="200" height="1.5" rx="0.75" fill="url(#line)" opacity="0.7"/>
    <!-- 赤坂 文字 -->
    <text x="256" y="252" text-anchor="middle" dominant-baseline="central"
      font-family="serif" font-size="148" font-weight="400" fill="#faf6ec">赤坂</text>
    <!-- 外食決定機 -->
    <text x="256" y="366" text-anchor="middle" dominant-baseline="central"
      font-family="serif" font-size="36" font-weight="400" fill="#faf6ec" letter-spacing="4">外食決定機</text>
    <!-- AKASAKA -->
    <text x="256" y="410" text-anchor="middle" dominant-baseline="central"
      font-family="Georgia,serif" font-size="24" font-weight="400"
      fill="#c9a656" font-style="italic" letter-spacing="8">AKASAKA</text>
  </g>
</svg>`;

async function generate() {
  const buf512 = Buffer.from(svg512);

  // 512x512 PNG
  await sharp(buf512)
    .png()
    .toFile(join(publicDir, "icon-512.png"));
  console.log("icon-512.png generated");

  // 192x192 PNG
  await sharp(buf512)
    .resize(192, 192)
    .png()
    .toFile(join(publicDir, "icon-192.png"));
  console.log("icon-192.png generated");

  // 180x180 apple-touch-icon
  await sharp(buf512)
    .resize(180, 180)
    .png()
    .toFile(join(publicDir, "apple-touch-icon.png"));
  console.log("apple-touch-icon.png generated");
}

generate().catch(console.error);

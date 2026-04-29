/**
 * 各レストランにlat/lngを付与するスクリプト
 * Nominatim (OpenStreetMap) で名前検索 → 見つからなければ駅座標でフォールバック
 * 実行: node scripts/geocode-restaurants.mjs
 */
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataFile = join(__dirname, "../data/restaurants.ts");

// エリア別の駅座標（フォールバック用）
const STATION_COORDS = {
  "赤坂":     { lat: 35.6741, lng: 139.7364 },
  "赤坂見附": { lat: 35.6756, lng: 139.7369 },
  "溜池山王": { lat: 35.6732, lng: 139.7402 },
};

// walkingMinutes → メートル（平均歩行速度80m/分）
const walkMeter = (min) => min * 80;

/** Nominatim で店名検索 */
async function geocode(name, area) {
  const query = encodeURIComponent(`${name} 赤坂 東京`);
  const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=jp`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "akasaka-food-app/1.0" }
    });
    const data = await res.json();
    if (data.length > 0) {
      const lat = parseFloat(data[0].lat);
      const lng = parseFloat(data[0].lon);
      // 赤坂エリア内かざっくり確認（±0.02度以内）
      const base = STATION_COORDS[area] ?? STATION_COORDS["赤坂"];
      if (Math.abs(lat - base.lat) < 0.03 && Math.abs(lng - base.lng) < 0.03) {
        return { lat, lng, source: "nominatim" };
      }
    }
  } catch (e) {
    // ignore
  }
  return null;
}

/** 駅座標からwalkingMinutesで散らした近似座標を生成 */
function approxCoords(area, walkingMinutes, seed) {
  const base = STATION_COORDS[area] ?? STATION_COORDS["赤坂"];
  const radius = walkMeter(walkingMinutes);
  // 疑似ランダムな角度（seedで決定的に）
  const angle = (seed * 137.508) % 360; // 黄金角で分散
  const latOffset = (radius / 111000) * Math.cos((angle * Math.PI) / 180);
  const lngOffset = (radius / (111000 * Math.cos(base.lat * Math.PI / 180))) * Math.sin((angle * Math.PI) / 180);
  return {
    lat: parseFloat((base.lat + latOffset).toFixed(6)),
    lng: parseFloat((base.lng + lngOffset).toFixed(6)),
    source: "approx",
  };
}

/** restaurants.ts からエントリを抽出 */
function extractRestaurants(src) {
  const entries = [];
  const idRe = /id:\s*"([^"]+)"/g;
  const nameRe = /name:\s*"([^"]+)"/g;
  const areaRe = /area:\s*"([^"]+)"/g;
  const walkRe = /walkingMinutes:\s*(\d+)/g;
  const latRe = /lat:\s*([\d.]+)/g;
  const lngRe = /lng:\s*([\d.]+)/g;

  // ブロック単位でパース
  const blockRe = /\{[^{}]*id:\s*"[^"]*"[^{}]*\}/gs;
  let block;
  while ((block = blockRe.exec(src)) !== null) {
    const id = (block[0].match(/id:\s*"([^"]+)"/) || [])[1];
    const name = (block[0].match(/name:\s*"([^"]+)"/) || [])[1];
    const area = (block[0].match(/area:\s*"([^"]+)"/) || [])[1];
    const walk = parseInt((block[0].match(/walkingMinutes:\s*(\d+)/) || [])[1] || "3");
    const hasLat = /lat:\s*[\d.]+/.test(block[0]);
    if (id && name && area) {
      entries.push({ id, name, area, walk, hasLat, index: block.index });
    }
  }
  return entries;
}

async function main() {
  const src = readFileSync(dataFile, "utf-8");
  const entries = extractRestaurants(src);
  console.log(`Found ${entries.length} restaurants`);

  const results = new Map();
  let nominatimHits = 0;
  let approxCount = 0;

  for (let i = 0; i < entries.length; i++) {
    const { id, name, area, walk, hasLat } = entries[i];
    if (hasLat) {
      console.log(`[${i+1}/${entries.length}] ${name} - already has coords, skip`);
      continue;
    }

    process.stdout.write(`[${i+1}/${entries.length}] ${name} ... `);
    const coords = await geocode(name, area);
    if (coords) {
      results.set(id, coords);
      nominatimHits++;
      console.log(`✓ nominatim (${coords.lat}, ${coords.lng})`);
    } else {
      const approx = approxCoords(area, walk, i);
      results.set(id, approx);
      approxCount++;
      console.log(`~ approx (${approx.lat}, ${approx.lng})`);
    }

    // Nominatim rate limit: 1 req/sec
    await new Promise(r => setTimeout(r, 1100));
  }

  console.log(`\nNominatim: ${nominatimHits}, Approx: ${approxCount}`);

  if (results.size === 0) {
    console.log("No changes to make.");
    return;
  }

  // restaurants.ts に lat/lng を追記
  let newSrc = src;
  for (const [id, { lat, lng }] of results) {
    // tabelogUrl の行の後に lat/lng を挿入（なければ openingHours の後）
    const insertAfterRe = new RegExp(
      `(id:\\s*"${id}"[\\s\\S]*?)(tabelogUrl:[^,\\n]+,?\\n|openingHours:[^,\\n]+,?\\n)`,
      "m"
    );
    newSrc = newSrc.replace(insertAfterRe, (match, before, field) => {
      if (/lat:/.test(match)) return match; // すでにある
      const indent = field.match(/^(\s*)/)[1];
      return before + field + `${indent}lat: ${lat},\n${indent}lng: ${lng},\n`;
    });
  }

  writeFileSync(dataFile, newSrc, "utf-8");
  console.log(`\n✅ Updated ${results.size} restaurants in restaurants.ts`);
}

main().catch(console.error);

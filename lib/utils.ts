import type { RankedRestaurant, Restaurant, Area } from "./types";

// ────────── 位置情報・距離計算 ──────────

/** エリアごとの駅座標 */
const STATION_COORDS: Record<Area, { lat: number; lng: number }> = {
  "赤坂":     { lat: 35.6741, lng: 139.7364 },
  "赤坂見附": { lat: 35.6756, lng: 139.7369 },
  "溜池山王": { lat: 35.6732, lng: 139.7402 },
};

/**
 * レストランの近似座標を返す。
 * restaurant.lat/lng があればそちらを優先、なければ
 * エリア駅座標 + walkingMinutes で散らした近似値を返す。
 */
export function getRestaurantCoords(restaurant: Restaurant): { lat: number; lng: number } {
  if (restaurant.lat !== undefined && restaurant.lng !== undefined) {
    return { lat: restaurant.lat, lng: restaurant.lng };
  }
  const base = STATION_COORDS[restaurant.area] ?? STATION_COORDS["赤坂"];
  const radius = restaurant.walkingMinutes * 75; // 75m/分
  // ID の文字コード和をシードにして決定論的に散らす
  const seed = restaurant.id.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
  const angle = (seed * 137.508) % 360; // 黄金角
  const latOffset = (radius / 111000) * Math.cos((angle * Math.PI) / 180);
  const lngOffset = (radius / (111000 * Math.cos((base.lat * Math.PI) / 180))) * Math.sin((angle * Math.PI) / 180);
  return {
    lat: base.lat + latOffset,
    lng: base.lng + lngOffset,
  };
}

/** Haversine距離（メートル） */
export function distanceMeters(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** 距離を表示用文字列に変換 */
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

/** Google Maps ナビURLを生成 */
export function googleMapsUrl(restaurant: Restaurant): string {
  const coords = getRestaurantCoords(restaurant);
  const name = encodeURIComponent(restaurant.name);
  return `https://www.google.com/maps/search/?api=1&query=${name}&query_place_id=&center=${coords.lat},${coords.lng}`;
}

// ひらがな・カタカナ・大小英字を統一してあいまい検索を可能にする
export function normalizeForSearch(text: string): string {
  return text
    .toLowerCase()
    // カタカナ → ひらがな
    .replace(/[\u30A1-\u30F6]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60));
}

export function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export function pickRandomRestaurant(ranked: RankedRestaurant[]): RankedRestaurant {
  const top = ranked.slice(0, 8);
  return pickRandom(top.length > 0 ? top : ranked);
}

export function formatCalories(cal: number): string {
  if (cal === 0) return "カロリー表記なし";
  return `約 ${cal} kcal`;
}

export function healthScoreLabel(score: number): string {
  const labels = ["", "★☆☆☆☆", "★★☆☆☆", "★★★☆☆", "★★★★☆", "★★★★★"];
  return labels[score] ?? "";
}

// ジャンル・シーンから混雑しやすい時間帯を推定して返す
export function getPeakHourWarnings(restaurant: Restaurant): string[] {
  const warnings: string[] = [];
  const hasLunch = restaurant.visitTypes.includes("ランチ");
  const hasDinner = restaurant.visitTypes.includes("ディナー");
  const hasDrink = restaurant.visitTypes.includes("軽く飲む") || restaurant.visitTypes.includes("お酒メイン");
  const { genre, walkingMinutes } = restaurant;
  const nearStation = walkingMinutes <= 3;

  // ランチのみ混雑（夜は比較的空いてる）
  if (hasLunch && ["ラーメン", "カフェ"].includes(genre)) {
    warnings.push(nearStation ? "ランチ 12〜13時は特に混雑" : "ランチ 12〜13時混雑");
  }

  // ランチ＋ディナー両方混雑
  if (["和食", "イタリアン", "中華", "洋食"].includes(genre)) {
    if (hasLunch) warnings.push(nearStation ? "ランチ 12〜13時は特に混雑" : "ランチ 12〜13時混雑");
    if (hasDinner || hasDrink) warnings.push("ディナー 19〜20時混雑");
  }

  // ディナーのみ混雑
  if (["焼肉", "居酒屋"].includes(genre) && (hasDinner || hasDrink)) {
    warnings.push("ディナー 19〜21時混雑");
  }

  return warnings;
}

// 曜日文字 → JS getDay() と同じ数値 (0=日, 1=月, ..., 6=土)
const DAY_MAP: Record<string, number> = { 日: 0, 月: 1, 火: 2, 水: 3, 木: 4, 金: 5, 土: 6 };

function parseDays(text: string): number[] {
  const days = new Set<number>();
  if (/毎日/.test(text) || /月[〜～]日/.test(text)) return [0, 1, 2, 3, 4, 5, 6];
  // 範囲（月〜金 など）を展開
  const stripped = text.replace(/([月火水木金土日])[〜～]([月火水木金土日])/g, (_, s, e) => {
    const si = DAY_MAP[s], ei = DAY_MAP[e];
    if (si <= ei) {
      for (let d = si; d <= ei; d++) days.add(d);
    } else {
      for (let d = si; d <= 6; d++) days.add(d);
      for (let d = 0; d <= ei; d++) days.add(d);
    }
    return "";
  });
  // 残った個別の曜日文字
  for (const ch of Object.keys(DAY_MAP)) {
    if (stripped.includes(ch)) days.add(DAY_MAP[ch]);
  }
  return [...days];
}

function parseTimeRanges(text: string): [number, number][] {
  const ranges: [number, number][] = [];
  const re = /(\d{1,2}):(\d{2})[〜～](翌)?(\d{1,2}):(\d{2})/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const start = parseInt(m[1]) * 60 + parseInt(m[2]);
    const endH = parseInt(m[4]) + (m[3] ? 24 : 0);
    const end = endH * 60 + parseInt(m[5]);
    ranges.push([start, end]);
  }
  return ranges;
}

// ランチ時の推定カロリー（ディナーの約70%）
export function estimateCaloriesForScene(calories: number, isLunch: boolean): number {
  return isLunch ? Math.round(calories * 0.7) : calories;
}

// "¥1,000〜¥1,999" → 1000 (下限値をパース)
export function parseBudgetLower(budgetStr: string): number | null {
  const m = budgetStr.match(/¥([\d,]+)/);
  if (!m) return null;
  return parseInt(m[1].replace(/,/g, ""));
}

export function isOpenNow(openingHours: string, now: Date = new Date()): boolean {
  if (!openingHours) return true;
  const currentDay = now.getDay();
  const currentMins = now.getHours() * 60 + now.getMinutes();
  const segments = openingHours.split(/\s*\/\s*/);
  let lastDays: number[] = [];

  for (const seg of segments) {
    if (!seg.trim()) continue;
    // 定休・休み セグメントはスキップ
    if (/定休|休み/.test(seg)) continue;

    const days = parseDays(seg);
    if (days.length > 0) lastDays = days;
    const applicableDays = lastDays;

    const timeRanges = parseTimeRanges(seg);
    for (const [start, end] of timeRanges) {
      if (end > 24 * 60) {
        // 深夜をまたぐ枠: 翌XX時 → 「前日扱い」で開いた枠が今日未明まで続く
        const prevDay = (currentDay + 6) % 7;
        if (applicableDays.includes(prevDay) && currentMins <= end - 24 * 60) return true;
        if (applicableDays.includes(currentDay) && currentMins >= start) return true;
      } else {
        if (applicableDays.includes(currentDay) && currentMins >= start && currentMins <= end) return true;
      }
    }
  }
  return false;
}

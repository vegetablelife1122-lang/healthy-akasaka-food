import type { RankedRestaurant } from "@/lib/types";
import { formatCalories, healthScoreLabel } from "@/lib/utils";

interface DecisionCardProps {
  ranked: RankedRestaurant;
  onRedraw: () => void;
}

const HEALTH_TAG_COLORS: Record<string, string> = {
  "野菜多め": "bg-green-200 text-green-800",
  "高たんぱく": "bg-blue-200 text-blue-800",
  "揚げ物少なめ": "bg-yellow-200 text-yellow-800",
  "軽め": "bg-purple-200 text-purple-800",
  "低カロリー": "bg-teal-200 text-teal-800",
  "魚介系": "bg-cyan-200 text-cyan-800",
  "発酵食品": "bg-orange-200 text-orange-800",
};

const GENRE_IMAGES: Record<string, string> = {
  "カフェ":     "photo-1554118811-1e0d58224f24",
  "和食":       "photo-1516684732162-798a0062be99",
  "中華":       "photo-1563245372-f21724e3856d",
  "焼肉":       "photo-1558030006-450675393462",
  "バー":       "photo-1543007630-9710e4a00a20",
  "ラーメン":   "photo-1569718212165-3a8278d5f624",
  "洋食":       "photo-1414235077428-338989a2e8c0",
  "居酒屋":     "photo-1528360983277-13d401cdc186",
  "焼鳥":       "photo-1529193591184-b1d58069ecdd",
  "イタリアン": "photo-1528137871618-79d2761e3fd5",
  "その他":     "photo-1517248135467-4c7edcad34c4",
};
const DEFAULT_IMAGE = "photo-1467003909585-2f8a72700288";

function getGenreImage(genre: string): string {
  const id = GENRE_IMAGES[genre] ?? DEFAULT_IMAGE;
  const path = id.startsWith("photo-") ? id : `photo-${id}`;
  return `https://images.unsplash.com/${path}?auto=format&fit=crop&w=1400&q=80`;
}

function getCalorieColor(cal: number): string {
  if (cal === 0) return "text-gray-400";
  if (cal <= 600) return "text-emerald-600 font-bold";
  if (cal <= 1000) return "text-amber-600 font-bold";
  return "text-red-500 font-bold";
}

export default function DecisionCard({ ranked, onRedraw }: DecisionCardProps) {
  const { restaurant, reason, isRelaxed } = ranked;

  return (
    <div className="rounded-2xl overflow-hidden shadow-xl">
      {/* Header */}
      <div className="relative overflow-hidden px-6 pt-6 pb-10">
        {/* 背景フード写真 */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('${getGenreImage(restaurant.genre)}')` }}
        />
        {/* グラデーション */}
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/70 via-black/40 to-emerald-950/80" />

        {/* 写真注意書き */}
        <p className="absolute bottom-2 right-3 text-white/30 text-xs z-10">※写真はイメージです</p>

        {/* テキスト */}
        <div className="relative">
          {/* ラベル行 */}
          <div className="flex items-center gap-2 mb-3">
            <p className="text-emerald-300 text-xs font-bold tracking-[0.3em] uppercase">Today&apos;s Pick</p>
            <span className="text-base">🏆</span>
          </div>

          <p className="text-white/70 text-sm font-medium mb-1 tracking-wide">今日の赤坂外食はここ！</p>

          <p className="text-3xl sm:text-4xl font-black text-white drop-shadow-lg mb-5 leading-tight">
            {restaurant.name}
          </p>

          <div className="flex flex-wrap gap-2">
            <span className="bg-white/20 text-white text-sm px-3 py-1 rounded-full backdrop-blur-sm font-medium">
              {restaurant.area}
            </span>
            <span className="bg-emerald-700/70 text-emerald-100 text-sm px-3 py-1 rounded-full backdrop-blur-sm font-medium">
              {restaurant.genre}
            </span>
            <span className="bg-white/20 text-white text-sm px-3 py-1 rounded-full backdrop-blur-sm">
              徒歩 {restaurant.walkingMinutes}分
            </span>
          </div>
        </div>
      </div>

      {/* White body */}
      <div className="bg-white px-6 py-5 space-y-4">
        {isRelaxed && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
            <p className="text-orange-700 text-sm">カロリー条件を少し緩めた候補です</p>
          </div>
        )}

        {/* Budget + Calories + Health score */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-400 mb-1">予算</p>
            <p className="text-sm font-bold text-gray-700 leading-tight">{restaurant.budget}</p>
          </div>
          <div className="bg-emerald-50 rounded-xl p-3">
            <p className="text-xs text-gray-400 mb-1">カロリー</p>
            <p className={`text-sm leading-tight ${getCalorieColor(restaurant.estimatedCalories)}`}>
              {formatCalories(restaurant.estimatedCalories)}
            </p>
          </div>
          <div className="bg-amber-50 rounded-xl p-3">
            <p className="text-xs text-gray-400 mb-1">健康スコア</p>
            <p className="text-sm font-bold text-amber-600 leading-tight">{healthScoreLabel(restaurant.healthScore)}</p>
          </div>
        </div>

        {/* Photo */}
        {restaurant.imageUrl && (
          <div className="rounded-xl overflow-hidden">
            <img
              src={restaurant.imageUrl}
              alt={`${restaurant.name}の写真`}
              className="w-full h-48 object-cover"
            />
          </div>
        )}

        {/* Description */}
        <p className="text-gray-600 text-sm leading-relaxed">{restaurant.description}</p>

        {/* Address & Hours */}
        <div className="space-y-1 text-sm text-gray-400">
          <p>📍 {restaurant.address}</p>
          <p>🕐 {restaurant.openingHours}</p>
        </div>

        {/* Tabelog link */}
        {restaurant.tabelogUrl && (
          <a
            href={restaurant.tabelogUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-4 py-2 bg-red-50 border border-red-100 text-red-500 text-sm font-medium rounded-xl hover:bg-red-100 transition-colors"
          >
            🍽️ 食べログで見る →
          </a>
        )}

        {/* Health tags */}
        {restaurant.healthTags.length > 0 && (
          <div>
            <p className="text-xs text-gray-400 mb-2 font-semibold">健康タグ</p>
            <div className="flex flex-wrap gap-1">
              {restaurant.healthTags.map((tag) => (
                <span
                  key={tag}
                  className={`px-3 py-1 text-xs rounded-full font-semibold ${HEALTH_TAG_COLORS[tag] ?? "bg-gray-100 text-gray-600"}`}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Drink pairings */}
        {restaurant.drinkPairings.length > 0 && (
          <div>
            <p className="text-xs text-gray-400 mb-2 font-semibold">相性の良いお酒</p>
            <div className="flex flex-wrap gap-1">
              {restaurant.drinkPairings.map((d) => (
                <span key={d} className="px-3 py-1 bg-slate-100 text-slate-600 text-xs rounded-full font-medium">
                  {d}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Reason */}
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
          <p className="text-xs text-emerald-600 font-bold mb-1">選ばれた理由</p>
          <p className="text-sm text-emerald-900 leading-relaxed">{reason}</p>
        </div>

        {/* Redraw button */}
        <button
          type="button"
          onClick={onRedraw}
          className="w-full border-2 border-emerald-600 text-emerald-700 hover:bg-emerald-50 font-bold py-3 px-6 rounded-xl text-base transition-colors"
        >
          もう一度引き直す
        </button>
      </div>
    </div>
  );
}

import type { RankedRestaurant } from "@/lib/types";
import { formatCalories, healthScoreLabel, getPeakHourWarnings } from "@/lib/utils";

interface RestaurantCardProps {
  ranked: RankedRestaurant;
  rank: number;
  isSelected: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
}

const HEALTH_TAG_COLORS: Record<string, string> = {
  "野菜多め": "bg-green-100 text-green-700",
  "高たんぱく": "bg-blue-100 text-blue-700",
  "揚げ物少なめ": "bg-yellow-100 text-yellow-700",
  "軽め": "bg-purple-100 text-purple-700",
  "低カロリー": "bg-teal-100 text-teal-700",
  "魚介系": "bg-cyan-100 text-cyan-700",
  "発酵食品": "bg-orange-100 text-orange-700",
};

const VISIT_TYPE_COLORS: Record<string, string> = {
  "ランチ": "bg-amber-100 text-amber-700",
  "ディナー": "bg-indigo-100 text-indigo-700",
  "軽く飲む": "bg-pink-100 text-pink-700",
  "お酒メイン": "bg-red-100 text-red-700",
};

function getRankBadgeStyle(rank: number): string {
  if (rank === 1) return "bg-amber-500 text-white shadow-sm ring-2 ring-amber-300 ring-offset-1";
  if (rank === 2) return "bg-slate-400 text-white shadow-sm";
  if (rank === 3) return "bg-orange-500 text-white shadow-sm";
  return "bg-emerald-700 text-white";
}

function getLeftBorderColor(healthScore: number, isSelected: boolean, isFavorite: boolean): string {
  if (isSelected) return "border-l-emerald-500";
  if (isFavorite) return "border-l-amber-400";
  if (healthScore >= 5) return "border-l-emerald-500";
  if (healthScore >= 4) return "border-l-teal-400";
  if (healthScore >= 3) return "border-l-gray-300";
  return "border-l-gray-200";
}

function getCalorieColor(cal: number): string {
  if (cal === 0) return "text-gray-500";
  if (cal <= 600) return "text-emerald-600";
  if (cal <= 1000) return "text-amber-600";
  return "text-red-500";
}

export default function RestaurantCard({ ranked, rank, isSelected, isFavorite = false, onToggleFavorite }: RestaurantCardProps) {
  const { restaurant, reason, isRelaxed } = ranked;
  const peakWarnings = getPeakHourWarnings(restaurant);

  return (
    <div
      className={`bg-white rounded-2xl shadow-sm p-4 border-l-4 transition-all ${
        getLeftBorderColor(restaurant.healthScore, isSelected, isFavorite)
      } ${
        isSelected ? "ring-2 ring-emerald-300" : isFavorite ? "ring-2 ring-amber-200" : ""
      }`}
    >
      {/* Rank badge + name + favorite */}
      <div className="flex items-start gap-2 mb-2">
        <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${getRankBadgeStyle(rank)}`}>
          {rank}
        </span>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-gray-800 leading-tight">{restaurant.name}</h3>
          {isRelaxed && (
            <span className="inline-block mt-0.5 px-2 py-0.5 bg-orange-100 text-orange-600 text-xs rounded-full">
              カロリー条件を少し緩めた候補
            </span>
          )}
        </div>
        {onToggleFavorite && (
          <button
            type="button"
            onClick={() => onToggleFavorite(restaurant.id)}
            className="flex-shrink-0 text-xl leading-none transition-transform hover:scale-125 active:scale-110"
            aria-label={isFavorite ? "お気に入りを解除" : "お気に入りに追加"}
          >
            {isFavorite ? "🌟" : "☆"}
          </button>
        )}
      </div>

      {/* Area + Genre + Walking + Visit types */}
      <div className="flex flex-wrap gap-1.5 mb-2">
        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
          {restaurant.area}
        </span>
        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs rounded-full font-medium border border-emerald-100">
          {restaurant.genre}
        </span>
        <span className="px-2 py-0.5 bg-gray-50 text-gray-500 text-xs rounded-full">
          徒歩 {restaurant.walkingMinutes}分
        </span>
        {restaurant.visitTypes.map((vt) => (
          <span
            key={vt}
            className={`px-2 py-0.5 text-xs rounded-full font-medium ${VISIT_TYPE_COLORS[vt] ?? "bg-gray-100 text-gray-600"}`}
          >
            {vt}
          </span>
        ))}
      </div>

      {/* Budget */}
      <div className="mb-1 text-sm">
        <span className="text-gray-400 text-xs">予算 </span>
        {restaurant.budgetLunch ? (
          <span className="text-gray-700 font-medium">ランチ {restaurant.budgetLunch} / 夜 {restaurant.budget}</span>
        ) : (
          <span className="text-gray-700 font-medium">{restaurant.budget}</span>
        )}
      </div>

      {/* Calories + Health score */}
      <div className="flex gap-3 mb-2 text-xs text-gray-500">
        <span>
          カロリー{" "}
          <span className={`font-semibold ${getCalorieColor(restaurant.estimatedCalories)}`}>
            {formatCalories(restaurant.estimatedCalories)}
          </span>
        </span>
        <span>健康 <span className="text-amber-500 font-medium">{healthScoreLabel(restaurant.healthScore)}</span></span>
      </div>

      {/* Health tags */}
      {restaurant.healthTags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-1.5">
          {restaurant.healthTags.map((tag) => (
            <span
              key={tag}
              className={`px-2 py-0.5 text-xs rounded-full font-medium ${HEALTH_TAG_COLORS[tag] ?? "bg-gray-100 text-gray-600"}`}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Drink pairings */}
      {restaurant.drinkPairings.length > 0 && (
        <div className="flex flex-wrap gap-1 items-center mb-2">
          <span className="text-xs text-gray-400">お酒：</span>
          {restaurant.drinkPairings.map((d) => (
            <span key={d} className="px-2 py-0.5 bg-slate-100 text-slate-500 text-xs rounded-full">
              {d}
            </span>
          ))}
        </div>
      )}

      {/* Description */}
      <p className="text-sm text-gray-600 mb-2 leading-snug line-clamp-2">{restaurant.description}</p>

      {/* Photo */}
      {restaurant.imageUrl && (
        <div className="mb-2 rounded-xl overflow-hidden">
          <img
            src={restaurant.imageUrl}
            alt={`${restaurant.name}の写真`}
            className="w-full h-32 object-cover"
          />
        </div>
      )}

      {/* Address + Hours */}
      <div className="mb-1.5 text-xs text-gray-400 space-y-0.5">
        <p>📍 {restaurant.address}</p>
        <p>🕐 {restaurant.openingHours}</p>
      </div>

      {/* Peak hour warnings */}
      {peakWarnings.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {peakWarnings.map((w) => (
            <span key={w} className="px-2 py-0.5 bg-orange-50 text-orange-500 text-xs rounded-full border border-orange-200">
              ⚠️ {w}
            </span>
          ))}
        </div>
      )}

      {/* Reason */}
      <div className="bg-emerald-50 rounded-lg px-3 py-2 border border-emerald-100 mb-1.5">
        <p className="text-xs text-emerald-500 font-semibold mb-0.5">選ばれた理由</p>
        <p className="text-sm text-emerald-800 font-medium line-clamp-2">{reason}</p>
      </div>

      {/* Tabelog link */}
      {restaurant.tabelogUrl && (
        <a
          href={restaurant.tabelogUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 border border-red-100 text-red-500 text-xs font-medium rounded-lg hover:bg-red-100 transition-colors"
        >
          🍽️ 食べログで見る →
        </a>
      )}
    </div>
  );
}

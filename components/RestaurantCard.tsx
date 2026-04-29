import type { RankedRestaurant, UserLocation } from "@/lib/types";
import { formatCalories, healthScoreLabel, getPeakHourWarnings, distanceMeters, getRestaurantCoords, formatDistance, googleMapsUrl } from "@/lib/utils";

interface RestaurantCardProps {
  ranked: RankedRestaurant;
  rank: number;
  isSelected: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
  userLocation?: UserLocation | null;
}

const HEALTH_TAG_BG: Record<string, string> = {
  "野菜多め":     "bg-forest-700/10 text-forest-800 border-forest-700/30",
  "高たんぱく":   "bg-gold-500/10 text-gold-700 border-gold-500/30",
  "揚げ物少なめ": "bg-emerald-500/10 text-forest-700 border-forest-500/30",
  "軽め":         "bg-ivory-100 text-sumi-700 border-ivory-200",
  "低カロリー":   "bg-forest-500/10 text-forest-700 border-forest-500/30",
  "魚介系":       "bg-forest-400/10 text-forest-700 border-forest-400/30",
  "発酵食品":     "bg-shu-500/10 text-shu-500 border-shu-500/30",
  "肉料理充実":   "bg-shu-500/10 text-shu-500 border-shu-500/30",
  "こだわり食材": "bg-gold-500/10 text-gold-700 border-gold-500/30",
  "揚げ物あり":   "bg-sumi-500/10 text-sumi-700 border-sumi-500/30",
};

const VISIT_TYPE_COLORS: Record<string, string> = {
  "ランチ":     "bg-gold-500/10 text-gold-700 border-gold-500/30",
  "ディナー":   "bg-forest-700/10 text-forest-800 border-forest-700/30",
  "軽く飲む":   "bg-ivory-100 text-sumi-700 border-ivory-200",
  "お酒メイン": "bg-shu-500/10 text-shu-500 border-shu-500/30",
};

function rankBadgeClass(rank: number): string {
  if (rank === 1) return "rank-badge rank-1";
  if (rank === 2) return "rank-badge rank-2";
  if (rank === 3) return "rank-badge rank-3";
  return "rank-badge rank-other";
}

function leftBorderColor(healthScore: number, isSelected: boolean, isFavorite: boolean): string {
  if (isSelected) return "#c9a656"; // gold
  if (isFavorite) return "#d8be7a"; // light gold
  if (healthScore >= 5) return "#1a4f3a"; // forest-700
  if (healthScore >= 4) return "#3f8d6e"; // forest-500
  if (healthScore >= 3) return "#6ba788"; // forest-400
  return "#e8dec9"; // ivory-200
}

function calorieColor(cal: number): string {
  if (cal === 0) return "text-sumi-500";
  if (cal <= 600) return "text-forest-500";
  if (cal <= 1000) return "text-gold-600";
  return "text-shu-500";
}

function StarRow({ score }: { score: number }) {
  const filled = "★".repeat(score);
  const empty = "★".repeat(5 - score);
  return (
    <span className="text-[13px] leading-none">
      <span className="text-gold-500">{filled}</span>
      <span className="text-ivory-200">{empty}</span>
    </span>
  );
}

export default function RestaurantCard({
  ranked,
  rank,
  isSelected,
  isFavorite = false,
  onToggleFavorite,
  userLocation,
}: RestaurantCardProps) {
  const { restaurant, reason, isRelaxed } = ranked;
  const peakWarnings = getPeakHourWarnings(restaurant);

  const distanceStr = (() => {
    if (!userLocation) return null;
    const c = getRestaurantCoords(restaurant);
    return formatDistance(distanceMeters(userLocation.lat, userLocation.lng, c.lat, c.lng));
  })();

  return (
    <article
      className={`resto-card p-4 sm:p-5 ${isSelected ? "ring-1 ring-gold-500" : ""}`}
      style={{ borderLeft: `3px solid ${leftBorderColor(restaurant.healthScore, isSelected, isFavorite)}` }}
    >
      {/* 順位 + 店名 + お気に入り */}
      <header className="flex items-start gap-3 mb-2">
        <span className={rankBadgeClass(rank)}>{rank}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <h3 className="font-mincho text-base sm:text-lg font-medium text-forest-900 leading-tight">
              {restaurant.name}
            </h3>
            {restaurant.nameReading && (
              <span className="font-cormorant italic text-[11px] text-gold-600 tracking-widest">
                {restaurant.nameReading}
              </span>
            )}
          </div>
          {isRelaxed && (
            <span className="inline-block mt-1 px-2 py-0.5 bg-shu-500/10 text-shu-500 text-[10px] rounded-full border border-shu-500/30">
              カロリー条件を少し緩めた候補
            </span>
          )}
        </div>
        {onToggleFavorite && (
          <button
            type="button"
            onClick={() => onToggleFavorite(restaurant.id)}
            className="flex-shrink-0 transition-transform hover:scale-110 active:scale-95"
            aria-label={isFavorite ? "お気に入りを解除" : "お気に入りに追加"}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill={isFavorite ? "#c9a656" : "none"}
              stroke={isFavorite ? "#a98948" : "#a98948"}
              strokeWidth="1.5"
            >
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
          </button>
        )}
      </header>

      {/* メタ行（エリア・ジャンル・徒歩・シーン） */}
      <div className="flex flex-wrap items-center gap-1.5 mb-3 text-[11px]">
        <span className="text-sumi-700">{restaurant.area}</span>
        <span className="text-sumi-500">·</span>
        <span className="text-forest-700 font-medium">{restaurant.genre}</span>
        <span className="text-sumi-500">·</span>
        <span className="text-sumi-500">徒歩 {restaurant.walkingMinutes}分</span>
        {distanceStr && (
          <span className="px-2 py-0.5 bg-forest-700/10 text-forest-800 border border-forest-700/20 text-[10px] rounded-full font-medium">
            📍 現在地から {distanceStr}
          </span>
        )}
        {restaurant.visitTypes.map((vt) => (
          <span
            key={vt}
            className={`px-2 py-0.5 text-[10px] rounded-full font-medium border ${
              VISIT_TYPE_COLORS[vt] ?? "bg-ivory-100 text-sumi-700 border-ivory-200"
            }`}
          >
            {vt}
          </span>
        ))}
      </div>

      <div className="gold-rule mb-3" />

      {/* 数値メイン：予算・カロリー・健康 */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div>
          <div className="text-[9px] tracking-widest uppercase text-sumi-500 mb-0.5">Budget</div>
          {restaurant.budgetLunch ? (
            <>
              <div className="font-cormorant text-base text-forest-900 leading-none">
                {restaurant.budgetLunch}
              </div>
              <div className="text-[10px] text-sumi-500 mt-0.5">ランチ / 夜 {restaurant.budget}</div>
            </>
          ) : (
            <div className="font-cormorant text-base text-forest-900 leading-none">
              {restaurant.budget}
            </div>
          )}
        </div>
        <div className="border-l border-ivory-200 pl-2">
          <div className="text-[9px] tracking-widest uppercase text-sumi-500 mb-0.5">Calorie</div>
          <div className={`font-cormorant text-base leading-none font-medium ${calorieColor(restaurant.estimatedCalories)}`}>
            {formatCalories(restaurant.estimatedCalories)}
          </div>
        </div>
        <div className="border-l border-ivory-200 pl-2">
          <div className="text-[9px] tracking-widest uppercase text-sumi-500 mb-0.5">Health</div>
          <div className="flex items-center gap-1">
            <StarRow score={restaurant.healthScore} />
          </div>
          <div className="text-[10px] text-sumi-500 mt-0.5">{healthScoreLabel(restaurant.healthScore)}</div>
        </div>
      </div>

      {/* 健康タグ */}
      {restaurant.healthTags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {restaurant.healthTags.map((tag) => (
            <span
              key={tag}
              className={`px-2 py-0.5 text-[10px] rounded-full font-medium border ${
                HEALTH_TAG_BG[tag] ?? "bg-ivory-100 text-sumi-700 border-ivory-200"
              }`}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* お酒 */}
      {restaurant.drinkPairings.length > 0 && (
        <div className="flex flex-wrap items-center gap-1 mb-2 text-[11px]">
          <span className="text-sumi-500">お酒：</span>
          {restaurant.drinkPairings.slice(0, 4).map((d) => (
            <span key={d} className="text-sumi-700">
              {d}
              <span className="text-sumi-500 mx-1 last:hidden">·</span>
            </span>
          ))}
          {restaurant.drinkPairings.length > 4 && (
            <span className="text-sumi-500">他{restaurant.drinkPairings.length - 4}</span>
          )}
        </div>
      )}

      {/* 説明 */}
      <p className="font-mincho text-[13px] text-sumi-700 leading-relaxed mb-3 line-clamp-2">
        {restaurant.description}
      </p>

      {/* 写真 */}
      {restaurant.imageUrl && (
        <div className="mb-3 rounded-xl overflow-hidden border border-ivory-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={restaurant.imageUrl}
            alt={`${restaurant.name}の写真`}
            className="w-full h-32 object-cover"
          />
        </div>
      )}

      {/* 住所・営業時間 */}
      <div className="text-[11px] text-sumi-500 space-y-0.5 mb-2">
        <p>{restaurant.address}</p>
        <p>{restaurant.openingHours}</p>
      </div>

      {/* ピーク注意 */}
      {peakWarnings.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {peakWarnings.map((w) => (
            <span
              key={w}
              className="px-2 py-0.5 bg-shu-500/10 text-shu-500 text-[10px] rounded-full border border-shu-500/30"
            >
              ⚠ {w}
            </span>
          ))}
        </div>
      )}

      {/* 選ばれた理由 */}
      <div className="paper rounded-lg px-3 py-2.5 border border-ivory-200 mb-2">
        <div className="font-cormorant italic text-[10px] tracking-[0.2em] text-gold-600 mb-1">
          REASON · 選ばれた理由
        </div>
        <p className="font-mincho text-[13px] text-forest-900 leading-relaxed line-clamp-2">
          {reason}
        </p>
      </div>

      {/* 食べログ + Google Maps */}
      <div className="flex flex-wrap gap-2">
        {restaurant.tabelogUrl && (
          <a
            href={restaurant.tabelogUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-ivory-50 border border-ivory-200 text-shu-500 text-[11px] font-medium rounded-lg hover:bg-shu-500/5 hover:border-shu-500/30 transition-colors"
          >
            食べログで見る
            <span className="font-cormorant italic">›</span>
          </a>
        )}
        <a
          href={googleMapsUrl(restaurant)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-ivory-50 border border-ivory-200 text-forest-700 text-[11px] font-medium rounded-lg hover:bg-forest-700/5 hover:border-forest-700/30 transition-colors"
        >
          📍 Google Maps
        </a>
      </div>
    </article>
  );
}

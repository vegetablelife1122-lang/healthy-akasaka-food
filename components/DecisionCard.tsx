import type { RankedRestaurant } from "@/lib/types";
import { formatCalories, healthScoreLabel } from "@/lib/utils";

interface DecisionCardProps {
  ranked: RankedRestaurant;
  onRedraw: () => void;
}

const HEALTH_TAG_DARK: Record<string, string> = {
  "野菜多め":     "bg-forest-500/30 text-ivory-50 border-forest-400/50",
  "高たんぱく":   "bg-gold-500/25 text-gold-300 border-gold-500/50",
  "揚げ物少なめ": "bg-forest-500/25 text-ivory-100 border-forest-400/50",
  "軽め":         "bg-ivory-50/10 text-ivory-100 border-ivory-50/30",
  "低カロリー":   "bg-forest-400/20 text-ivory-50 border-forest-400/50",
  "魚介系":       "bg-forest-400/20 text-ivory-50 border-forest-400/50",
  "発酵食品":     "bg-shu-500/20 text-ivory-100 border-shu-500/50",
  "肉料理充実":   "bg-shu-500/20 text-ivory-100 border-shu-500/50",
  "こだわり食材": "bg-gold-500/20 text-gold-300 border-gold-500/50",
  "揚げ物あり":   "bg-sumi-500/30 text-ivory-100 border-sumi-500/50",
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

function calorieDarkColor(cal: number): string {
  if (cal === 0) return "text-ivory-200";
  if (cal <= 600) return "text-forest-400";
  if (cal <= 1000) return "text-gold-400";
  return "text-shu-500";
}

function StarRow({ score }: { score: number }) {
  const filled = "★".repeat(score);
  const empty = "★".repeat(5 - score);
  return (
    <span className="text-base leading-none">
      <span className="text-gold-500">{filled}</span>
      <span className="text-ivory-200/30">{empty}</span>
    </span>
  );
}

export default function DecisionCard({ ranked, onRedraw }: DecisionCardProps) {
  const { restaurant, reason, isRelaxed } = ranked;

  return (
    <div className="rounded-2xl overflow-hidden shadow-2xl">
      {/* ============ 上：「発表」ステージ ============ */}
      <div className="relative px-6 py-10 sm:py-14 overflow-hidden bg-forest-900">
        {/* 背景写真 */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('${getGenreImage(restaurant.genre)}')` }}
        />
        {/* グラデーション：上は薄く、下を深緑で締める */}
        <div className="absolute inset-0 bg-gradient-to-b from-forest-900/35 via-forest-900/45 to-forest-900/85" />

        {/* きらめき */}
        <span className="sparkle" style={{ top: "12%", left: "10%" }} />
        <span className="sparkle" style={{ top: "25%", right: "15%", width: 6, height: 6, animationDelay: "0.4s" }} />
        <span className="sparkle" style={{ top: "60%", left: "20%", animationDelay: "0.8s" }} />
        <span className="sparkle" style={{ top: "75%", right: "18%", width: 3, height: 3, animationDelay: "1.2s" }} />
        <span className="sparkle" style={{ top: "40%", left: "85%", width: 5, height: 5, animationDelay: "1.6s" }} />

        <div className="relative text-center">
          {/* TONIGHT'S CHOICE */}
          <p className="font-cormorant italic text-gold-400 text-xs sm:text-sm tracking-[0.4em] mb-5">
            · TONIGHT&apos;S CHOICE ·
          </p>

          {/* L字フレーム＋店名 */}
          <div className="decision-frame relative px-5 sm:px-7 py-6 sm:py-8 bg-forest-900/65 backdrop-blur-sm rounded-sm">
            <p className="font-cormorant italic text-[10px] sm:text-xs tracking-[0.3em] text-gold-400 mb-3">
              RESTAURANT №01
            </p>

            <h3 className="font-mincho text-3xl sm:text-4xl font-medium text-ivory-50 leading-tight drop-shadow-lg break-words">
              {restaurant.name}
            </h3>
            {restaurant.nameReading && (
              <p className="font-cormorant italic text-[11px] tracking-widest text-gold-400 mt-2">
                {restaurant.nameReading}
              </p>
            )}

            <div className="flex justify-center items-center gap-2 mt-4">
              <StarRow score={restaurant.healthScore} />
              <span className="font-cormorant italic text-[11px] tracking-widest text-gold-400 ml-1">
                HEALTH {restaurant.healthScore}.0
              </span>
            </div>

            <p className="text-ivory-200 text-xs sm:text-sm mt-3">
              {restaurant.area} ‧ {restaurant.genre} ‧ 徒歩{restaurant.walkingMinutes}分
            </p>
          </div>

          {isRelaxed && (
            <p className="mt-4 font-cormorant italic text-[10px] text-shu-500 tracking-widest">
              · CALORIE FILTER WAS RELAXED ·
            </p>
          )}
        </div>

        <p className="absolute bottom-2 right-3 text-ivory-50/30 text-[10px] z-10">
          ※写真はイメージです
        </p>
      </div>

      {/* ============ 下：詳細情報（紙の質感） ============ */}
      <div className="paper px-6 py-6 space-y-5 border-x border-b border-ivory-200">
        {/* 三本柱：予算・カロリー・健康スコア */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center">
            <div className="text-[9px] tracking-widest uppercase text-sumi-500 mb-1">Budget</div>
            <div className="font-cormorant text-xl text-forest-900 leading-tight">
              {restaurant.budget}
            </div>
          </div>
          <div className="text-center border-x border-ivory-200">
            <div className="text-[9px] tracking-widest uppercase text-sumi-500 mb-1">Calorie</div>
            <div className={`font-cormorant text-xl leading-tight font-medium ${calorieDarkColor(restaurant.estimatedCalories).replace("text-forest-400","text-forest-500").replace("text-gold-400","text-gold-600").replace("text-ivory-200","text-sumi-500")}`}>
              {formatCalories(restaurant.estimatedCalories)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-[9px] tracking-widest uppercase text-sumi-500 mb-1">Health</div>
            <div className="font-cormorant text-xl text-forest-900 leading-tight">
              {healthScoreLabel(restaurant.healthScore)}
            </div>
          </div>
        </div>

        <div className="gold-rule" />

        {/* 写真 */}
        {restaurant.imageUrl && (
          <div className="rounded-xl overflow-hidden border border-ivory-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={restaurant.imageUrl}
              alt={`${restaurant.name}の写真`}
              className="w-full h-48 object-cover"
            />
          </div>
        )}

        {/* 説明 */}
        <p className="font-mincho text-sm text-sumi-700 leading-relaxed">
          {restaurant.description}
        </p>

        {/* 住所＆営業 */}
        <div className="space-y-1 text-xs text-sumi-500">
          <p>{restaurant.address}</p>
          <p>{restaurant.openingHours}</p>
        </div>

        {/* 健康タグ */}
        {restaurant.healthTags.length > 0 && (
          <div>
            <div className="font-cormorant italic text-[10px] tracking-[0.2em] text-gold-600 mb-2">
              HEALTH · 健康タグ
            </div>
            <div className="flex flex-wrap gap-1.5">
              {restaurant.healthTags.map((tag) => (
                <span
                  key={tag}
                  className="chip chip-gold chip-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* お酒 */}
        {restaurant.drinkPairings.length > 0 && (
          <div>
            <div className="font-cormorant italic text-[10px] tracking-[0.2em] text-gold-600 mb-2">
              DRINKS · 相性の良いお酒
            </div>
            <div className="flex flex-wrap gap-1.5">
              {restaurant.drinkPairings.map((d) => (
                <span key={d} className="chip chip-sm">
                  {d}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 選ばれた理由 */}
        <div className="rounded-xl px-4 py-3 border border-forest-700/30 bg-forest-700/5">
          <div className="font-cormorant italic text-[10px] tracking-[0.2em] text-gold-600 mb-1">
            REASON · 選ばれた理由
          </div>
          <p className="font-mincho text-sm text-forest-900 leading-relaxed">
            {reason}
          </p>
        </div>

        {/* 食べログ + 引き直し */}
        <div className="flex flex-col sm:flex-row gap-2">
          {restaurant.tabelogUrl && (
            <a
              href={restaurant.tabelogUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-shu-500/5 border border-shu-500/30 text-shu-500 text-sm font-mincho rounded-xl hover:bg-shu-500/10 transition-colors"
            >
              食べログで見る
              <span className="font-cormorant italic">›</span>
            </a>
          )}
          <button
            type="button"
            onClick={onRedraw}
            className="flex-1 px-4 py-3 border border-forest-700 text-forest-700 hover:bg-forest-700 hover:text-ivory-50 font-mincho text-sm rounded-xl transition-colors"
          >
            もう一度、引き直す
          </button>
        </div>
      </div>
    </div>
  );
}

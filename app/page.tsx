"use client";

import { useState, useRef } from "react";
import type { Filters, RankedRestaurant, UserLocation } from "@/lib/types";
import { rankRestaurants } from "@/lib/scoring";
import { pickRandomRestaurant, distanceMeters, getRestaurantCoords } from "@/lib/utils";
import { restaurants } from "@/data/restaurants";
import FilterForm from "@/components/FilterForm";
import RestaurantCard from "@/components/RestaurantCard";
import DecisionCard from "@/components/DecisionCard";
import { playRandomFanfare, playHazure } from "@/lib/sounds";
import { useFavorites } from "@/lib/useFavorites";

const HAZURE_ITEMS = [
  {
    store: "セブンイレブン",
    name: "昆布おにぎり",
    tag: "おにぎり",
    price: "¥150〜250",
    kcal: "約 170 kcal",
    score: "★★☆☆☆",
    desc: "赤坂のセブンイレブンの定番おにぎり。北海道産昆布使用。塩分控えめで低カロリー。忙しい日のランチにも最適。",
    tags: ["低カロリー", "軽め"],
  },
  {
    store: "セブンイレブン",
    name: "サラダチキン（プレーン）",
    tag: "サラダチキン",
    price: "¥250〜300",
    kcal: "約 110 kcal",
    score: "★★★★☆",
    desc: "高タンパク・低カロリーの定番。ダイエット中の強い味方。",
    tags: ["高タンパク", "低カロリー", "ダイエット向け"],
  },
  {
    store: "セブンイレブン",
    name: "野菜スティック",
    tag: "野菜",
    price: "¥150〜200",
    kcal: "約 170 kcal",
    score: "★★★☆☆",
    desc: "こうじ味噌マヨ込みで170kcal。野菜だからヘルシーとは言ってない。",
    tags: ["超低カロリー", "野菜", "ヘルシー"],
  },
];

const HAZURE_REASONS = [
  "今日はそういう日だったということで。",
  "昨日食べすぎたから。",
  "近いから。",
];

const DEFAULT_FILTERS: Filters = {
  name: "",
  area: "",
  visitType: "",
  maxCalories: null,
  maxBudget: null,
  genre: "",
  drink: "",
  preferHealthy: false,
  preferHighProtein: false,
  preferVegetable: false,
  preferLowFried: false,
  openNow: false,
  sortByDistance: false,
};

export default function HomePage() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [results, setResults] = useState<RankedRestaurant[]>([]);
  const [selected, setSelected] = useState<RankedRestaurant | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [isHazure, setIsHazure] = useState(false);
  const [hazureReason, setHazureReason] = useState("");
  const [hazureItem, setHazureItem] = useState(HAZURE_ITEMS[0]);

  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const { favorites, toggle: toggleFavorite, isFavorite } = useFavorites();

  const resultsRef = useRef<HTMLDivElement>(null);
  const decisionRef = useRef<HTMLDivElement>(null);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("この端末では位置情報が使えません");
      return;
    }
    setLocationLoading(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationLoading(false);
        setFilters((f) => ({ ...f, sortByDistance: true }));
      },
      () => {
        setLocationError("位置情報の取得に失敗しました");
        setLocationLoading(false);
      },
      { timeout: 10000 }
    );
  };

  const displayedResults = showFavoritesOnly
    ? results.filter((r) => isFavorite(r.restaurant.id))
    : results;

  const handleSubmit = () => {
    let ranked = rankRestaurants(restaurants, filters);
    if (filters.sortByDistance && userLocation) {
      ranked = [...ranked].sort((a, b) => {
        const ca = getRestaurantCoords(a.restaurant);
        const cb = getRestaurantCoords(b.restaurant);
        return (
          distanceMeters(userLocation.lat, userLocation.lng, ca.lat, ca.lng) -
          distanceMeters(userLocation.lat, userLocation.lng, cb.lat, cb.lng)
        );
      });
    }
    setResults(ranked);
    setSelected(null);
    setHasSearched(true);
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const handleDecide = () => {
    const pool = showFavoritesOnly ? displayedResults : results;
    if (pool.length === 0) return;
    setSelected(null);
    setIsHazure(false);
    // 1/20でハズレ（コンビニのおにぎり）
    if (Math.random() < 1 / 20) {
      playHazure();
      setHazureReason(HAZURE_REASONS[Math.floor(Math.random() * HAZURE_REASONS.length)]);
      setHazureItem(HAZURE_ITEMS[Math.floor(Math.random() * HAZURE_ITEMS.length)]);
      setTimeout(() => {
        setIsHazure(true);
        setTimeout(() => {
          decisionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      }, 300);
      return;
    }
    const pick = pickRandomRestaurant(pool);
    playRandomFanfare(() => {
      setSelected(pick);
      setTimeout(() => {
        decisionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    });
  };

  const handleRedraw = () => {
    const pool = showFavoritesOnly ? displayedResults : results;
    if (pool.length === 0) return;
    setIsHazure(false);
    const pick = pickRandomRestaurant(pool);
    setSelected(pick);
    playRandomFanfare();
  };

  return (
    <main className="min-h-screen">
      {/* ============ HEADER ============ */}
      <header className="relative text-ivory-50 overflow-hidden">
        {/* 背景フード写真 */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?auto=format&fit=crop&w=1400&q=80')",
          }}
        />
        {/* 深いオーバーレイ */}
        <div className="absolute inset-0 bg-gradient-to-b from-forest-900/40 via-forest-900/70 to-forest-900" />

        {/* ビル群＋高架シルエット（深いフォレストで沈める） */}
        <svg
          className="absolute bottom-0 left-0 w-full pointer-events-none"
          viewBox="0 0 800 90"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMax meet"
          aria-hidden="true"
        >
          <rect x="0"   y="10" width="30" height="80" fill="#0d2e22" opacity="0.95" />
          <rect x="34"  y="30" width="26" height="60" fill="#0d2e22" opacity="0.9"  />
          <rect x="64"  y="0"  width="28" height="90" fill="#0d2e22" opacity="0.95" />
          <rect x="68"  y="-4" width="8"  height="6"  fill="#0d2e22" opacity="0.9"  />
          <rect x="96"  y="22" width="24" height="68" fill="#0d2e22" opacity="0.9"  />
          <rect x="124" y="45" width="20" height="45" fill="#0d2e22" opacity="0.85" />
          <rect x="148" y="15" width="26" height="75" fill="#0d2e22" opacity="0.92" />
          <rect x="178" y="55" width="18" height="35" fill="#0d2e22" opacity="0.85" />
          <rect x="200" y="38" width="22" height="52" fill="#0d2e22" opacity="0.88" />

          <rect x="578" y="38" width="22" height="52" fill="#0d2e22" opacity="0.88" />
          <rect x="604" y="55" width="18" height="35" fill="#0d2e22" opacity="0.85" />
          <rect x="626" y="15" width="26" height="75" fill="#0d2e22" opacity="0.92" />
          <rect x="656" y="45" width="20" height="45" fill="#0d2e22" opacity="0.85" />
          <rect x="680" y="22" width="24" height="68" fill="#0d2e22" opacity="0.9"  />
          <rect x="708" y="0"  width="28" height="90" fill="#0d2e22" opacity="0.95" />
          <rect x="712" y="-4" width="8"  height="6"  fill="#0d2e22" opacity="0.9"  />
          <rect x="740" y="30" width="26" height="60" fill="#0d2e22" opacity="0.9"  />
          <rect x="770" y="10" width="30" height="80" fill="#0d2e22" opacity="0.95" />

          {/* 高架の柱 */}
          {[240, 290, 340, 390, 440, 490, 540].map((x) => (
            <rect key={x} x={x} y="52" width="6" height="38" fill="#0d2e22" opacity="0.9" rx="1" />
          ))}
          {/* 高架の梁 */}
          <rect x="237" y="48" width="312" height="7" fill="#0d2e22" opacity="0.9" rx="2" />
          {/* 金のレール（線） */}
          <rect x="235" y="44" width="316" height="2" fill="#c9a656" opacity="0.55" rx="1" />
          <rect x="235" y="50" width="316" height="1" fill="#c9a656" opacity="0.35" rx="1" />
        </svg>

        {/* 上部の小さなロゴ行 */}
        <div className="relative z-10 max-w-2xl mx-auto px-5 pt-5 flex justify-between items-center">
          <span className="font-cormorant italic tracking-[0.3em] text-[11px] text-gold-400">
            EST. 2026
          </span>
          <span className="font-cormorant italic tracking-[0.3em] text-[11px] text-gold-400">
            AKASAKA · TOKYO
          </span>
        </div>

        {/* メインタイトル */}
        <div className="relative z-10 py-14 sm:py-20 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <p className="font-cormorant italic text-gold-400 text-xs sm:text-sm tracking-[0.4em] mb-4">
              · TONIGHT&apos;S CHOICE ·
            </p>
            <h1 className="font-mincho text-2xl sm:text-3xl font-medium leading-tight text-ivory-50 drop-shadow-lg">
              健康を気にする人のための<br />赤坂外食決定機
            </h1>
            <div className="flex justify-center my-4">
              <div className="mizuhiki" />
            </div>
            <p
              className="font-mincho text-ivory-100/90 text-xs sm:text-sm leading-relaxed"
              style={{ wordBreak: "auto-phrase" } as React.CSSProperties}
            >
              カロリー・ジャンル・シーン・お酒の条件を選んで、<br />
              今日の自分にぴったりの1店を見つけよう。
            </p>
          </div>
        </div>
      </header>

      {/* ============ BODY ============ */}
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-10">
        {/* 件数表示 */}
        <div className="text-center">
          <div className="font-cormorant italic text-[11px] tracking-[0.3em] text-gold-600">
            <span className="font-cormorant text-base not-italic text-forest-900 tracking-normal mx-1">
              {restaurants.length}
            </span>
            RESTAURANTS · 赤坂エリアの掲載店
          </div>
        </div>

        {/* Filter form */}
        <section>
          <FilterForm filters={filters} onChange={setFilters} onSubmit={handleSubmit} />
          {/* 現在地ボタン */}
          <div className="mt-3 flex flex-col items-center gap-1">
            <button
              type="button"
              onClick={handleGetLocation}
              disabled={locationLoading}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                userLocation
                  ? "bg-forest-800 text-ivory-50 border-forest-700"
                  : "bg-white text-forest-800 border-forest-300 hover:border-forest-600"
              } ${locationLoading ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              <span>{locationLoading ? "⏳" : userLocation ? "📍" : "🗺️"}</span>
              <span>
                {locationLoading
                  ? "位置情報を取得中..."
                  : userLocation
                  ? "現在地から近い順で表示中"
                  : "現在地から近い順にする"}
              </span>
            </button>
            {locationError && (
              <p className="text-red-500 text-xs">{locationError}</p>
            )}
            {userLocation && (
              <button
                type="button"
                onClick={() => {
                  setUserLocation(null);
                  setFilters((f) => ({ ...f, sortByDistance: false }));
                }}
                className="text-xs text-gray-400 hover:text-gray-600 underline"
              >
                現在地をリセット
              </button>
            )}
          </div>
        </section>

        {/* Results */}
        {hasSearched && (
          <section ref={resultsRef}>
            <div className="flex items-end justify-between mb-5 gap-3">
              <div>
                <div className="section-label">CANDIDATES</div>
                <h2 className="font-mincho text-xl mt-1 text-forest-900">
                  健康を意識した候補
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-cormorant text-sm italic text-gold-600 whitespace-nowrap">
                  {results.length} of {restaurants.length}
                </span>
                {favorites.size > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowFavoritesOnly((v) => !v)}
                    className={`chip chip-sm whitespace-nowrap ${showFavoritesOnly ? "chip-gold" : ""}`}
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="-mt-px"
                    >
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                    お気に入り {favorites.size}
                  </button>
                )}
              </div>
            </div>

            {results.length === 0 ? (
              <div className="paper rounded-2xl p-10 text-center border border-ivory-200">
                <p className="font-mincho text-base text-sumi-700">
                  条件に合う店が、見つかりませんでした。
                </p>
                <p className="font-cormorant italic text-xs text-gold-600 mt-2 tracking-widest">
                  · TRY OTHER FILTERS ·
                </p>
              </div>
            ) : displayedResults.length === 0 && showFavoritesOnly ? (
              <div className="paper rounded-2xl p-10 text-center border border-ivory-200">
                <p className="font-mincho text-base text-sumi-700">
                  この検索結果に、お気に入りはありません。
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {displayedResults.map((ranked, index) => (
                  <RestaurantCard
                    key={ranked.restaurant.id}
                    ranked={ranked}
                    rank={index + 1}
                    isSelected={selected?.restaurant.id === ranked.restaurant.id}
                    isFavorite={isFavorite(ranked.restaurant.id)}
                    onToggleFavorite={toggleFavorite}
                    userLocation={userLocation}
                  />
                ))}
              </div>
            )}

            {results.length > 0 && (
              <div className="mt-8">
                <button
                  type="button"
                  onClick={handleDecide}
                  className="decide-btn w-full py-4 px-6 rounded-xl font-mincho text-lg tracking-widest"
                >
                  今宵の一軒を、決める
                  <span className="block text-[10px] font-cormorant italic mt-1 text-gold-400 tracking-[0.3em]">
                    DECIDE TONIGHT
                  </span>
                </button>
                <p className="text-center font-cormorant italic text-[11px] text-gold-600 mt-3 tracking-widest">
                  · randomly picked from top 8 ·
                </p>
              </div>
            )}
          </section>
        )}

        {/* Decision card */}
        {selected && (
          <section ref={decisionRef}>
            <DecisionCard ranked={selected} onRedraw={handleRedraw} />
          </section>
        )}

        {/* ============ ハズレカード ============ */}
        {isHazure && !selected && (
          <section ref={decisionRef}>
            <div className="rounded-2xl overflow-hidden shadow-xl">
              {/* 上：暗い 7-Eleven 写真 */}
              <div className="relative overflow-hidden px-6 pt-8 pb-10 bg-sumi-900">
                <div
                  className="absolute inset-0 bg-cover"
                  style={{
                    backgroundImage: "url('/seven-eleven.jpg.png')",
                    backgroundPosition: "center 15%",
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-sumi-900/70 via-sumi-900/55 to-sumi-900/85" />
                <p className="absolute bottom-2 right-3 text-ivory-50/30 text-[10px] z-10">
                  ※写真はイメージです
                </p>

                <div className="relative text-center">
                  <p className="font-cormorant italic text-shu-500 text-xs sm:text-sm tracking-[0.4em] mb-3">
                    · UNFORTUNATELY ·
                  </p>
                  <div className="inline-block shu-stamp mb-3">
                    PROBABILITY 1/20
                  </div>
                  <h2 className="font-mincho text-xl sm:text-2xl text-ivory-50 mb-2 drop-shadow-lg">
                    今夜は、外食、しないで。
                  </h2>
                  <div className="mizuhiki mx-auto my-3 opacity-80" />
                  <h3 className="font-mincho text-3xl sm:text-4xl font-medium text-ivory-50 leading-tight drop-shadow-lg">
                    {hazureItem.store}
                    <br />
                    {hazureItem.name}
                  </h3>
                </div>
              </div>

              {/* 下：紙の質感の本体 */}
              <div className="paper px-6 py-6 space-y-5 border-x border-b border-ivory-200">
                {/* 三本柱 */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-[9px] tracking-widest uppercase text-sumi-500 mb-1">Price</div>
                    <div className="font-cormorant text-base text-forest-900 leading-tight">
                      {hazureItem.price}
                    </div>
                  </div>
                  <div className="border-x border-ivory-200">
                    <div className="text-[9px] tracking-widest uppercase text-sumi-500 mb-1">Calorie</div>
                    <div className="font-cormorant text-base text-forest-500 leading-tight">
                      {hazureItem.kcal}
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] tracking-widest uppercase text-sumi-500 mb-1">Score</div>
                    <div className="text-gold-500 leading-tight text-base">
                      {hazureItem.score}
                    </div>
                  </div>
                </div>

                <div className="gold-rule" />

                {/* タグ */}
                <div className="flex flex-wrap gap-1.5 justify-center">
                  <span className="chip chip-sm">赤坂</span>
                  <span className="chip chip-sm">{hazureItem.tag}</span>
                  <span className="chip chip-sm">徒歩 1分</span>
                  {hazureItem.tags.map((t) => (
                    <span key={t} className="chip chip-sm chip-gold">
                      {t}
                    </span>
                  ))}
                </div>

                {/* 説明 */}
                <p className="font-mincho text-sm text-sumi-700 leading-relaxed">
                  {hazureItem.desc}
                </p>

                <div className="space-y-1 text-xs text-sumi-500">
                  <p>港区赤坂 セブンイレブン赤坂店</p>
                  <p>24時間営業 / 年中無休</p>
                </div>

                {/* 選ばれた理由 */}
                <div className="miss-card px-4 py-3">
                  <div className="font-cormorant italic text-[10px] tracking-[0.2em] text-shu-500 mb-1">
                    REASON · 選ばれた理由
                  </div>
                  <p className="font-mincho text-sm text-sumi-700 leading-relaxed">
                    {hazureReason}
                  </p>
                </div>

                <p className="text-center font-mincho text-xs text-sumi-500 leading-relaxed">
                  たまには、こういう夜も<br className="sm:hidden" />悪くないですよ。
                </p>

                <button
                  type="button"
                  onClick={handleRedraw}
                  className="w-full px-4 py-3 border border-forest-700 text-forest-700 hover:bg-forest-700 hover:text-ivory-50 font-mincho text-sm rounded-xl transition-colors"
                >
                  もう一度、引き直す
                </button>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* ============ FOOTER ============ */}
      <footer className="text-center py-10 mt-8 border-t border-ivory-200">
        <div className="max-w-2xl mx-auto px-4">
          <div className="gold-rule max-w-xs mx-auto mb-4" />
          <p className="font-mincho text-xs text-sumi-700">
            健康を気にする人のための赤坂外食決定機
          </p>
          <p className="font-cormorant italic text-[10px] text-gold-600 mt-2 tracking-[0.3em]">
            · SAMPLE DATA · AKASAKA · TOKYO ·
          </p>
        </div>
      </footer>
    </main>
  );
}

"use client";

import type { Filters, Area, VisitType, Genre, Drink } from "@/lib/types";
import { AREAS, VISIT_TYPES, GENRES, DRINKS, CALORIE_PRESETS, BUDGET_PRESETS } from "@/lib/constants";

interface FilterFormProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  onSubmit: () => void;
}

const HEALTH_OPTIONS = [
  { key: "preferHealthy" as const, label: "ヘルシー全般" },
  { key: "preferHighProtein" as const, label: "高たんぱく" },
  { key: "preferVegetable" as const, label: "野菜多め" },
  { key: "preferLowFried" as const, label: "揚げ物少なめ" },
];

export default function FilterForm({ filters, onChange, onSubmit }: FilterFormProps) {
  const update = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    onChange({ ...filters, [key]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  // active 判定をスマートに書きやすくする
  const isActive = <T extends string>(current: T | "", value: T) => current === value;

  return (
    <form onSubmit={handleSubmit} className="paper rounded-2xl border border-ivory-200 shadow-sm overflow-hidden">
      {/* ヘッダー */}
      <div className="px-6 pt-6 pb-3 flex items-end justify-between">
        <div>
          <div className="section-label">FILTERS</div>
          <h3 className="font-mincho text-lg mt-1 text-forest-900">条件を選ぶ</h3>
        </div>
      </div>
      <div className="gold-rule mx-6" />

      <div className="p-6 space-y-6">
        {/* Name search */}
        <div>
          <div className="text-[10px] tracking-[0.2em] uppercase text-sumi-500 mb-2">
            Name · 店名で探す
          </div>
          <input
            type="text"
            value={filters.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="例：山ぶき、焼鳥..."
            className="w-full bg-ivory-100 border border-ivory-200 rounded-lg px-4 py-2.5 text-sm font-mincho focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500 placeholder:text-sumi-500/60"
          />
        </div>

        {/* Area chips */}
        <div>
          <div className="text-[10px] tracking-[0.2em] uppercase text-sumi-500 mb-2">
            Area · エリア
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => update("area", "")}
              className={`chip ${filters.area === "" ? "chip-active" : ""}`}
            >
              すべて
            </button>
            {AREAS.map((a) => (
              <button
                type="button"
                key={a}
                onClick={() => update("area", a as Area)}
                className={`chip ${isActive(filters.area, a) ? "chip-active" : ""}`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        {/* Scene chips */}
        <div>
          <div className="text-[10px] tracking-[0.2em] uppercase text-sumi-500 mb-2">
            Scene · シーン
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => update("visitType", "")}
              className={`chip ${filters.visitType === "" ? "chip-active" : ""}`}
            >
              すべて
            </button>
            {VISIT_TYPES.map((v) => (
              <button
                type="button"
                key={v}
                onClick={() => update("visitType", v as VisitType)}
                className={`chip ${isActive(filters.visitType, v) ? "chip-active" : ""}`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Genre chips */}
        <div>
          <div className="text-[10px] tracking-[0.2em] uppercase text-sumi-500 mb-2">
            Genre · 料理ジャンル
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => update("genre", "")}
              className={`chip ${filters.genre === "" ? "chip-active" : ""}`}
            >
              すべて
            </button>
            {GENRES.map((g) => (
              <button
                type="button"
                key={g}
                onClick={() => update("genre", g as Genre)}
                className={`chip ${isActive(filters.genre, g) ? "chip-active" : ""}`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Drink chips */}
        <div>
          <div className="text-[10px] tracking-[0.2em] uppercase text-sumi-500 mb-2">
            Drink · 飲みたいもの
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => update("drink", "")}
              className={`chip ${filters.drink === "" ? "chip-active" : ""}`}
            >
              指定なし
            </button>
            {DRINKS.map((d) => (
              <button
                type="button"
                key={d}
                onClick={() => update("drink", d as Drink)}
                className={`chip ${isActive(filters.drink, d) ? "chip-active" : ""}`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Calories */}
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <div className="text-[10px] tracking-[0.2em] uppercase text-sumi-500">
              Calorie · カロリー上限
              {filters.visitType === "ランチ" && (
                <span className="ml-2 normal-case tracking-normal text-[10px] text-gold-600">（ランチ換算）</span>
              )}
            </div>
            <span className="font-cormorant text-base text-forest-900">
              {filters.maxCalories !== null ? `${filters.maxCalories}` : "—"}{" "}
              <span className="text-[10px] tracking-widest text-sumi-500">kcal</span>
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-3">
            <button
              type="button"
              onClick={() => update("maxCalories", null)}
              className={`chip chip-sm ${filters.maxCalories === null ? "chip-active" : ""}`}
            >
              指定なし
            </button>
            {CALORIE_PRESETS.map((cal) => (
              <button
                type="button"
                key={cal}
                onClick={() => update("maxCalories", cal)}
                className={`chip chip-sm ${filters.maxCalories === cal ? "chip-active" : ""}`}
              >
                {cal}
              </button>
            ))}
          </div>
          {filters.maxCalories !== null && (
            <input
              type="range"
              min={300}
              max={1800}
              step={50}
              value={filters.maxCalories}
              onChange={(e) => update("maxCalories", Number(e.target.value))}
              className="akasaka-slider"
            />
          )}
        </div>

        {/* Budget */}
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <div className="text-[10px] tracking-[0.2em] uppercase text-sumi-500">
              Budget · 予算上限
              {filters.visitType === "ランチ" && (
                <span className="ml-2 normal-case tracking-normal text-[10px] text-gold-600">（ランチ価格）</span>
              )}
            </div>
            <span className="font-cormorant text-base text-forest-900">
              {filters.maxBudget !== null ? `¥${filters.maxBudget.toLocaleString()}` : "—"}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-3">
            <button
              type="button"
              onClick={() => update("maxBudget", null)}
              className={`chip chip-sm ${filters.maxBudget === null ? "chip-active" : ""}`}
            >
              指定なし
            </button>
            {BUDGET_PRESETS.map((b) => (
              <button
                type="button"
                key={b}
                onClick={() => update("maxBudget", b)}
                className={`chip chip-sm ${filters.maxBudget === b ? "chip-active" : ""}`}
              >
                ¥{b.toLocaleString()}
              </button>
            ))}
          </div>
          {filters.maxBudget !== null && (
            <input
              type="range"
              min={500}
              max={20000}
              step={500}
              value={filters.maxBudget}
              onChange={(e) => update("maxBudget", Number(e.target.value))}
              className="akasaka-slider"
            />
          )}
        </div>

        {/* Open now toggle */}
        <div>
          <label className="flex items-center justify-between cursor-pointer group">
            <div>
              <div className="text-[10px] tracking-[0.2em] uppercase text-sumi-500">Open · 営業状況</div>
              <div className="font-mincho text-sm mt-0.5 text-forest-900 group-hover:text-gold-600">今、営業している店だけ</div>
            </div>
            <div className="relative">
              <input
                type="checkbox"
                checked={filters.openNow}
                onChange={(e) => update("openNow", e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-12 h-7 bg-ivory-200 rounded-full peer peer-checked:bg-forest-700 transition-colors border border-ivory-200" />
              <div className="absolute top-0.5 left-0.5 w-6 h-6 bg-ivory-50 rounded-full shadow transition-transform peer-checked:translate-x-5 border border-gold-500/30" />
            </div>
          </label>
        </div>

        {/* Health preferences (gold chips) */}
        <div>
          <div className="text-[10px] tracking-[0.2em] uppercase text-sumi-500 mb-2">
            Health · 健康志向
          </div>
          <div className="flex flex-wrap gap-1.5">
            {HEALTH_OPTIONS.map(({ key, label }) => {
              const checked = filters[key];
              return (
                <button
                  type="button"
                  key={key}
                  onClick={() => update(key, !checked)}
                  className={`chip ${checked ? "chip-gold" : ""}`}
                >
                  {checked ? "✓" : ""} {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="decide-btn w-full py-3.5 px-6 rounded-xl font-mincho text-base tracking-widest"
        >
          候補を見る
          <span className="block text-[10px] font-cormorant italic mt-0.5 text-gold-400 tracking-[0.3em]">
            VIEW CANDIDATES
          </span>
        </button>
      </div>
    </form>
  );
}

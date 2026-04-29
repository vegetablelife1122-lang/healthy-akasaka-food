import type { Restaurant, Filters, RankedRestaurant } from "./types";
import { SCORE_WEIGHTS, MAX_RESULTS, MIN_RESULTS, CALORIE_RELAX_MARGIN } from "./constants";
import { normalizeForSearch, isOpenNow, parseBudgetLower, estimateCaloriesForScene } from "./utils";

function scoreRestaurant(restaurant: Restaurant, filters: Filters, relaxCalories: boolean): number {
  let score = 0;

  if (filters.name) {
    const q = normalizeForSearch(filters.name);
    const matchName = normalizeForSearch(restaurant.name).includes(q);
    const matchReading = restaurant.nameReading ? normalizeForSearch(restaurant.nameReading).includes(q) : false;
    if (matchName || matchReading) {
      score += SCORE_WEIGHTS.NAME_MATCH;
    }
  }

  if (filters.area && restaurant.area === filters.area) {
    score += SCORE_WEIGHTS.AREA_MATCH;
  }

  if (filters.visitType && restaurant.visitTypes.includes(filters.visitType)) {
    score += SCORE_WEIGHTS.VISIT_TYPE_MATCH;
  }

  if (filters.maxCalories !== null) {
    const isLunch = filters.visitType === "ランチ";
    const effectiveCalories = estimateCaloriesForScene(restaurant.estimatedCalories, isLunch);
    const limit = relaxCalories
      ? filters.maxCalories + CALORIE_RELAX_MARGIN
      : filters.maxCalories;
    if (effectiveCalories <= limit) {
      score += relaxCalories ? SCORE_WEIGHTS.CALORIE_RELAXED : SCORE_WEIGHTS.CALORIE_OK;
    }
  }

  if (filters.drink && filters.drink !== "飲まない" && restaurant.drinkPairings.includes(filters.drink)) {
    score += SCORE_WEIGHTS.DRINK_MATCH;
    // ワインを選択時、バーかつワインが筆頭ドリンクの店を最優先
    if (filters.drink === "ワイン" && restaurant.genre === "バー" && restaurant.drinkPairings[0] === "ワイン") {
      score += SCORE_WEIGHTS.DRINK_MATCH;
    }
  }

  if (filters.genre && restaurant.genre === filters.genre) {
    score += SCORE_WEIGHTS.GENRE_MATCH;
  }

  if (filters.preferHealthy && restaurant.healthTags.length > 0) {
    score += SCORE_WEIGHTS.HEALTH_TAG_MATCH;
  }
  if (filters.preferHighProtein && restaurant.healthTags.includes("高たんぱく")) {
    score += SCORE_WEIGHTS.HEALTH_TAG_MATCH;
  }
  if (filters.preferVegetable && restaurant.healthTags.includes("野菜多め")) {
    score += SCORE_WEIGHTS.HEALTH_TAG_MATCH;
  }
  if (filters.preferLowFried && restaurant.healthTags.includes("揚げ物少なめ")) {
    score += SCORE_WEIGHTS.HEALTH_TAG_MATCH;
  }

  const isDrinkFocused = filters.visitType === "軽く飲む" || filters.visitType === "お酒メイン";
  if (isDrinkFocused) {
    if (restaurant.healthTags.includes("軽め")) score += SCORE_WEIGHTS.HEALTH_TAG_MATCH;
    if (restaurant.healthTags.includes("揚げ物少なめ")) score += SCORE_WEIGHTS.HEALTH_TAG_MATCH;
  }

  score += SCORE_WEIGHTS.HEALTH_SCORE_BASE * restaurant.healthScore;

  if (restaurant.walkingMinutes <= 5) {
    score += SCORE_WEIGHTS.WALKING_BONUS;
  }

  return score;
}

function buildReason(restaurant: Restaurant, filters: Filters, isRelaxed: boolean): string {
  const parts: string[] = [];

  if (filters.area && restaurant.area === filters.area) {
    parts.push(`${restaurant.area}にある`);
  }
  if (filters.visitType && restaurant.visitTypes.includes(filters.visitType)) {
    parts.push(`${filters.visitType}に対応`);
  }
  if (filters.genre && restaurant.genre === filters.genre) {
    parts.push(`${restaurant.genre}ジャンル`);
  }
  if (filters.drink && filters.drink !== "飲まない" && restaurant.drinkPairings.includes(filters.drink)) {
    parts.push(`${filters.drink}が楽しめる`);
  }
  if (restaurant.healthTags.length > 0) {
    parts.push(restaurant.healthTags.slice(0, 2).join("・") + "なメニューあり");
  }
  if (restaurant.healthScore >= 4) {
    parts.push("健康スコアが高い");
  }
  if (isRelaxed && filters.maxCalories !== null) {
    parts.push(`カロリー条件を少し緩めた候補`);
  }

  if (parts.length === 0) {
    parts.push(`赤坂エリアの${restaurant.genre}店`);
  }

  return parts.join("、") + "。";
}

export function rankRestaurants(
  restaurants: Restaurant[],
  filters: Filters
): RankedRestaurant[] {
  let candidates = filters.genre
    ? restaurants.filter((r) => r.genre === filters.genre)
    : restaurants;

  if (filters.openNow) {
    candidates = candidates.filter((r) => isOpenNow(r.openingHours));
  }

  if (filters.maxCalories !== null) {
    const isLunch = filters.visitType === "ランチ";
    candidates = candidates.filter((r) => {
      const effectiveCalories = estimateCaloriesForScene(r.estimatedCalories, isLunch);
      return effectiveCalories <= filters.maxCalories! + CALORIE_RELAX_MARGIN;
    });
  }

  if (filters.maxBudget !== null) {
    candidates = candidates.filter((r) => {
      // ランチ選択時はbudgetLunchを優先、なければbudgetで判定
      const budgetStr = filters.visitType === "ランチ" && r.budgetLunch
        ? r.budgetLunch
        : r.budget;
      const lower = parseBudgetLower(budgetStr);
      // 下限が不明な場合は除外しない
      if (lower === null) return true;
      return lower <= filters.maxBudget!;
    });
  }

  const strictScores = candidates.map((r) => ({
    restaurant: r,
    score: scoreRestaurant(r, filters, false),
    reason: buildReason(r, filters, false),
    isRelaxed: false,
  }));

  const sorted = [...strictScores].sort((a, b) => b.score - a.score);
  const topStrict = sorted.slice(0, MAX_RESULTS);

  if (topStrict.length >= MIN_RESULTS) {
    return topStrict;
  }

  const relaxedScores = candidates.map((r) => ({
    restaurant: r,
    score: scoreRestaurant(r, filters, true),
    reason: buildReason(r, filters, true),
    isRelaxed: true,
  }));

  const relaxedSorted = [...relaxedScores].sort((a, b) => b.score - a.score);
  return relaxedSorted.slice(0, MAX_RESULTS);
}

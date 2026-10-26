/**
 * Every number in this file is a judgement call.
 *
 * Checks must not hardcode numbers. They import from here, and every finding
 * they emit has to carry a `why` string explaining the number in plain language
 * plus an `evidence` object with the raw values. The user has to be able to
 * disagree with us.
 */
export const T = {
  /** Exact duplicate rows. Any duplicate is worth mentioning. Past 1% of the
   *  file it stops being a stray double-entry and starts skewing class balance
   *  and inflating cross-validation scores. */
  duplicates: { highRatio: 0.01 },

  /** Missing values per column. Below 5% almost anything works. Past 30% the
   *  imputed value dominates the real signal, so the column is often better
   *  dropped than filled. Past 60% there is barely a column there. */
  missing: { low: 0.05, medium: 0.3, high: 0.6 },

  /** A column where one value covers ~everything carries almost no information.
   *  Mirrors the usual near-zero-variance filter. */
  constant: { dominantRatio: 0.99 },

  /** Unique-per-row columns. Harmless to store, destructive as a feature: a
   *  tree will happily memorise them. Needs a floor on row count or every tiny
   *  file trips it. */
  idLike: { uniqueRatio: 0.95, minRows: 50 },

  /** Type agreement within a column. Below 60% there is no dominant type, so
   *  the column is genuinely free text. Above 99.5% the handful of odd values
   *  are likely sentinels ("N/A", "unknown") rather than a parsing problem. */
  mixedTypes: { minDominant: 0.6, maxDominant: 0.995 },

  /** Case/whitespace variants of the same category. Only worth scanning while
   *  cardinality is low enough that it is a category column at all. */
  dirtyCategories: { maxCardinality: 200 },

  /** Minority class share. Under 10% plain accuracy starts to mislead. Under
   *  1% it is meaningless and you need resampling or a different metric. */
  imbalance: { medium: 0.1, high: 0.01 },

  /**
   * Target leakage.
   *
   * categoricalPurity: group rows by the column's value; if the target is
   *   essentially constant inside every group, the column already encodes the
   *   answer.
   * numericAccuracy: one untuned threshold on a single column beating 98%
   *   means the column was almost certainly computed from the target.
   * minRows: below this, small-sample noise produces perfect splits by accident
   *   and findings get downgraded with a caveat instead of suppressed.
   * maxCardinalityRatio: a column with a distinct value for nearly every row
   *   reaches purity 1.0 trivially. That is an ID column, not leakage, and the
   *   id-like check already reports it.
   * maxTargetClasses: above this the target is a regression target or free
   *   text, and this classification-shaped check does not apply.
   */
  leakage: {
    categoricalPurity: 0.99,
    numericAccuracy: 0.98,
    minRows: 200,
    maxCardinalityRatio: 0.5,
    maxTargetClasses: 20,
  },

  /** Response size guards. */
  limits: { rowIndexesPerFinding: 100, examplesPerFinding: 5 },

  /** Health score deductions, highest-severity-first, clamped at 0. */
  score: { high: 25, medium: 10, low: 3, info: 0 },
};

/**
 * The check registry.
 *
 * Checks are plain modules with the same shape, so the engine can run them
 * without knowing anything about what they do. Adding a check means writing a
 * file and adding one line here. Nothing else in the codebase changes.
 *
 * Order matters only for how findings appear before sorting, so keep the
 * structural checks first and the inferential ones last.
 */
import * as duplicateRows from './checks/duplicateRows.js';
import * as contamination from './checks/contamination.js';
import * as missingValues from './checks/missingValues.js';
import * as constantColumns from './checks/constantColumns.js';
import * as idLikeColumns from './checks/idLikeColumns.js';
import * as mixedTypes from './checks/mixedTypes.js';
import * as dirtyCategories from './checks/dirtyCategories.js';
import * as classImbalance from './checks/classImbalance.js';
import * as targetLeakage from './checks/targetLeakage.js';

export const CHECKS = [
  duplicateRows,
  contamination,
  missingValues,
  constantColumns,
  idLikeColumns,
  mixedTypes,
  dirtyCategories,
  classImbalance,
  targetLeakage,
];

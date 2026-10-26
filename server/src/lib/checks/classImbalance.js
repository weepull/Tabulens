import { T } from '../thresholds.js';
import { pct } from '../finding.js';

export const id = 'class-imbalance';
export const label = 'Class imbalance';
export const needs = { target: true };

export function run({ profile, target, finding }) {
  const col = profile.get(target);
  if (!col || col.unique < 2 || col.unique > T.leakage.maxTargetClasses) return [];

  const dist = [...col.counts.entries()]
    .map(([value, count]) => ({ value, count, share: count / col.present }))
    .sort((a, b) => b.count - a.count);

  const minority = dist[dist.length - 1];
  if (minority.share > T.imbalance.medium) {
    return [
      finding({
        severity: 'info',
        title: `\`${target}\` is reasonably balanced`,
        detail: dist.map((d) => `${d.value}: ${pct(d.share)}`).join(', ') + '.',
        why: `The smallest class holds ${pct(minority.share)}, above the ${pct(T.imbalance.medium)} point where plain accuracy starts to mislead.`,
        evidence: { distribution: dist },
        columns: [target],
      }),
    ];
  }

  return [
    finding({
      severity: minority.share < T.imbalance.high ? 'high' : 'medium',
      title: `\`${target}\` is imbalanced: "${minority.value}" is only ${pct(minority.share)} of rows`,
      detail:
        dist.map((d) => `${d.value}: ${d.count} (${pct(d.share)})`).join(', ') +
        `. A model that always predicts "${dist[0].value}" would score ${pct(dist[0].share)} accuracy.`,
      why:
        `Below ${pct(T.imbalance.medium)} minority share, accuracy mostly measures the majority ` +
        `class and hides total failure on the one you probably care about. Below ` +
        `${pct(T.imbalance.high)} it is meaningless. Use precision, recall or AUC, and consider ` +
        `class weights or resampling. Split with stratification so the ratio survives the split.`,
      evidence: { distribution: dist, minorityShare: minority.share, majorityBaseline: dist[0].share },
      columns: [target],
    }),
  ];
}

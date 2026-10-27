/**
 * The nine checks as dealt on the landing page. Every `result` is what the
 * analyzer reports for the bundled loans example (examples/loans_train.csv +
 * loans_test.csv, target `defaulted`). Re-run it if a check's logic changes.
 *
 * Order is the 3x3 grid's reading order (and the card numbers). Index 4 is the
 * centre card, which the scroll deck deals last; see DEAL_ORDER in ScrollDeck.
 */
export type DeckSeverity = 'high' | 'medium' | 'low' | 'info' | 'none';

export type DeckResultPart = string | { code: string };

export type DeckCheck = {
  key: string;
  name: string;
  catches: string;
  /** Mixed plain text and column names (rendered in mono). */
  result: DeckResultPart[];
  severity: DeckSeverity;
};

export const DECK_CHECKS: DeckCheck[] = [
  {
    key: 'leakage',
    name: 'Target leakage',
    catches: 'A column that is really a copy of the answer.',
    result: [{ code: 'risk_score' }, ' predicts ', { code: 'defaulted' }, ' 99.1% of the time'],
    severity: 'high',
  },
  {
    key: 'contamination',
    name: 'Train/test contamination',
    catches: 'Test rows that also sit in the training file.',
    result: ['14 test rows also in training: 13.5% of the test set'],
    severity: 'high',
  },
  {
    key: 'duplicates',
    name: 'Duplicate rows',
    catches: 'The same row counted twice, or more.',
    result: ['3 exact duplicate rows (0.93% of the file)'],
    severity: 'medium',
  },
  {
    key: 'constant',
    name: 'Constant columns',
    catches: 'Columns with one value that teach the model nothing.',
    result: [{ code: 'country' }, ' has the same value in every row'],
    severity: 'medium',
  },
  {
    key: 'mixed',
    name: 'Mixed types',
    catches: 'Numbers and text mixed in one column.',
    result: ['None in the loans file — and that’s a result too'],
    severity: 'none',
  },
  {
    key: 'id',
    name: 'ID-like columns',
    catches: 'Row identifiers posing as features.',
    result: [{ code: 'application_id' }, ' looks like an identifier'],
    severity: 'medium',
  },
  {
    key: 'dirty',
    name: 'Dirty categories',
    catches: 'One category typed several different ways.',
    result: [{ code: 'city' }, ': 2 categories spelled more than one way, ', { code: 'employment_type' }, ': 2'],
    severity: 'medium',
  },
  {
    key: 'missing',
    name: 'Missing values',
    catches: 'Columns with a lot of empty cells.',
    result: [{ code: 'income' }, ' is 17.3% empty'],
    severity: 'low',
  },
  {
    key: 'imbalance',
    name: 'Class imbalance',
    catches: 'A label where one class is rare.',
    result: ['Balanced: no warning'],
    severity: 'info',
  },
];

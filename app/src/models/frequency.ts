export const allFrequencies = ['Monthly', 'Weekly', 'Daily', 'Yearly'] as const;

export type Frequency = typeof allFrequencies[number];
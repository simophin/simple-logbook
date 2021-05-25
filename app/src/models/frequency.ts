import {createEnumType} from "../utils/codecs";

export const allFrequencies = ['Monthly', 'Weekly', 'Daily', 'Yearly'] as const;

export type Frequency = typeof allFrequencies[number];

export const frequencyType = createEnumType<Frequency>(allFrequencies);
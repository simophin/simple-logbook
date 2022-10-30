import { Accessor, createContext } from "solid-js";

export type DarkMode = 'light' | 'dark';

export const DarkModeContext = createContext<Accessor<DarkMode>>(() => 'light' as DarkMode);

export function toggleDarkMode(m: DarkMode) {
    return m == 'light' ? 'dark' : 'light';
}

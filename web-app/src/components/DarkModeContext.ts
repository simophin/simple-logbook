import { Accessor, createContext } from "solid-js";

export type DarkMode = 'light' | 'dark';

export const DarkModeContext = createContext<Accessor<DarkMode>>(() => 'light' as DarkMode);

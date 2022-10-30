import { createMediaQuery } from '@solid-primitives/media';
import { createEffect, createMemo, createSignal } from 'solid-js';
import AuthContainer from './components/AuthContainer';
import { DarkMode, DarkModeContext } from './components/DarkModeContext';
import Themed from './components/Themed';

import Nav from './Nav';

export default function App() {
  const systemIsDark = createMediaQuery("(prefers-color-scheme: dark)");
  const systemDarkTheme = createMemo<DarkMode>(() => systemIsDark() ? 'dark' : 'light');
  const [forceDarkTheme, setForceDarkTheme] = createSignal<DarkMode>();
  const darkMode = () => forceDarkTheme() || systemDarkTheme();

  return (
    <DarkModeContext.Provider value={darkMode}>
      <Themed primaryColor='#3AAF85' applyBodyBackground>
        <AuthContainer needsAuth={false}>
          <Nav
            onToggleDarkTheme={() => {
              setForceDarkTheme((forcedDarkTHeme) => {
                const system = systemDarkTheme();
                const newTheme = (forcedDarkTHeme || system) === 'dark' ? 'light' : 'dark';
                console.log(`newTheme = ${newTheme}, systemTheme = ${system}`);
                if (system === newTheme) {
                  return undefined;
                }
                return newTheme;
              });
            }}
            charts={[{ title: "Chart 1", id: "1" }]}
            onAddRecordClicked={() => { }} />
        </AuthContainer>
      </Themed>
    </DarkModeContext.Provider>
  );
};

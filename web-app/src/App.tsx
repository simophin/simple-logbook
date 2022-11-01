import { createMediaQuery } from '@solid-primitives/media';
import { Route, Routes } from '@solidjs/router';
import { createMemo, createSignal, lazy } from 'solid-js';
import AuthContainer from './components/AuthContainer';
import { DarkMode, DarkModeContext } from './components/DarkModeContext';
import Themed from './components/Themed';
const RecordList = lazy(() => import("./records/RecordList"));

import Nav from './Nav';

export default function App() {
  const systemIsDark = createMediaQuery("(prefers-color-scheme: dark)");
  const systemDarkTheme = createMemo<DarkMode>(() => systemIsDark() ? 'dark' : 'light');
  const [forceDarkTheme, setForceDarkTheme] = createSignal<DarkMode>();
  const darkMode = () => forceDarkTheme() || systemDarkTheme();

  return (
    <DarkModeContext.Provider value={darkMode}>
      <Themed primaryColor='#3AAF85' applyBodyBackground>
        <AuthContainer needsAuth={false} class="flex flex-col absolute w-full h-full">
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

          <div class="w-full bg-background text-onBackground flex flex-grow overflow-y-hidden">
            <Routes>
              <Route path='/records' component={RecordList} />
            </Routes>
          </div>
        </AuthContainer>
      </Themed>
    </DarkModeContext.Provider>
  );
};

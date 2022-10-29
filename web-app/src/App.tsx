import { createMediaQuery } from '@solid-primitives/media';
import type { Component } from 'solid-js';
import AuthContainer from './components/AuthContainer';
import Themed from './components/Themed';

import Nav from './Nav';

const App: Component = () => {
  const dark = createMediaQuery("(prefers-color-scheme: dark)");

  return (
    <Themed primaryColor='#3AAF85' dark={dark()}>
      <AuthContainer needsAuth={false}>
        <Nav
          charts={[{ title: "Chart 1", id: "1" }]}
          onAddRecordClicked={() => { }} />
      </AuthContainer>
    </Themed>
  );
};

export default App;

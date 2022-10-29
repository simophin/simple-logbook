import type { Component } from 'solid-js';
import AuthContainer from './components/AuthContainer';

import Nav from './Nav';

const App: Component = () => {
  return (
    <AuthContainer needsAuth={false}>
      <Nav
        charts={[{ title: "Chart 1", id: "1" }]}
        onAddRecordClicked={() => { }} />
    </AuthContainer>
  );
};

export default App;

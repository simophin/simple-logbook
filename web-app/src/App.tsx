import type { Component } from 'solid-js';
import AuthContainer from './components/AuthContainer';

import logo from './logo.svg';
import Nav from './Nav';

const App: Component = () => {
  return (
    <AuthContainer needsAuth={true}>
      <Nav
        charts={[{ title: "Chart 1", id: "1" }]}
        onAddRecordClicked={() => { }} />
    </AuthContainer>
  );
};

export default App;

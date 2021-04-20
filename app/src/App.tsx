import React from 'react';
import './App.css';
import {Button} from "@material-ui/core";
import {useRequest} from "./hooks/useRequest";
import * as t from 'io-ts';
import {useTransaction} from "./hooks/useTransaction";

function App() {
  const data = useRequest('https://httpbin.org/get', 'get', t.string);
  console.log('Request data', data);

  const transaction = useTransaction('hello');
  if (transaction.type === 'loaded') {
  }

  return (
      <Button color="primary">Hello, world</Button>
  );
}

export default App;

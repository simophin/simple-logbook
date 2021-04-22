import React from 'react';
import './App.css';
import {Button} from "@material-ui/core";
import TxEntry from "./components/TxEntry";

function App() {

    return <>
        <Button color="primary">Hello, world</Button>

        <TxEntry/>
    </>;
}

export default App;

import React, {useState} from 'react';
import './App.css';
import {AppBar, Tab, Tabs} from "@material-ui/core";
import NewTransactionPage from "./page/NewTransactionPage";

function App() {
    const [selectedTab, setSelectedTab] = useState(0);



    return <>
        <AppBar position="static">
            <Tabs value={selectedTab} onChange={(e, nv) => setSelectedTab(nv)}>
                <Tab label="New transaction"/>
                <Tab label="Spending report"/>
                <Tab label="Income report"/>
            </Tabs>
        </AppBar>

        {selectedTab === 0 && <NewTransactionPage/>}

    </>;
}

export default App;
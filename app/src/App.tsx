import React, {useState} from 'react';
import './App.css';
import {AppBar, Container, Tab, Tabs} from "@material-ui/core";
import TransactionPage from "./page/TransactionPage";

function App() {
    const [selectedTab, setSelectedTab] = useState(0);

    return <>
        <AppBar>
            <Tabs value={selectedTab} onChange={(e, nv) => setSelectedTab(nv)}>
                <Tab label="Transactions"/>
                <Tab label="Spending report"/>
                <Tab label="Income report"/>
            </Tabs>
        </AppBar>

        <Container style={{marginTop: 80}}>
            {selectedTab === 0 && <TransactionPage/>}
        </Container>
    </>;
}

export default App;
import React, {useState} from 'react';
import './App.css';
import {AppBar, Container, Fade, Tab, Tabs} from "@material-ui/core";
import AccountsPage from "./page/AccountsPage";
import TransactionPage from "./page/TransactionPage";
import AccountGroupEntry from "./components/AccountGroupEntry";

function App() {
    const [selectedTab, setSelectedTab] = useState(0);

    return <>
        <AppBar>
            <Tabs value={selectedTab} onChange={(e, nv) => setSelectedTab(nv)}>
                <Tab label="Transactions"/>
                <Tab label="Accounts"/>
            </Tabs>
        </AppBar>

        <Container style={{marginTop: 80}}>
            {selectedTab === 0 && <Fade in><TransactionPage/></Fade>}
            {selectedTab === 1 && <Fade in><AccountsPage/></Fade>}
        </Container>
    </>;
}

export default App;
import React, {useState} from 'react';
import './App.css';
import {AppBar, Box, Container, Fade, Tab, Tabs} from "@material-ui/core";
import AccountsPage from "./page/AccountsPage";
import TransactionPage from "./page/TransactionPage";

function App() {
    const [selectedTab, setSelectedTab] = useState(0);

    return <>
        <AppBar position="sticky">
            <Tabs value={selectedTab} onChange={(e, nv) => setSelectedTab(nv)}>
                <Tab label="Transactions"/>
                <Tab label="Accounts"/>
            </Tabs>
        </AppBar>

        <Box>
            {selectedTab === 0 && <Fade in><TransactionPage/></Fade>}
            {selectedTab === 1 && <Fade in><AccountsPage/></Fade>}
        </Box>
    </>;
}

export default App;
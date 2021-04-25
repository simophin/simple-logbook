import {Box, Container} from "@material-ui/core";
import {DataGrid, GridColumns} from "@material-ui/data-grid";
import {useObservable} from "../hooks/useObservable";
import listAccounts from "../api/listAccount";
import currency from 'currency.js';
import {useMemo, useState} from "react";
import {AccountGroup} from "../models/AccountGroup";
import _ from "lodash";
import AccountGroupSelect from "../components/AccountGroupSelect";

const accountColumns: GridColumns = [
    {field: "name", headerName: "Name", flex: 25},
    {
        field: "balance", headerName: "Balance", flex: 10,
        valueFormatter: (v) =>
            currency(v.value as unknown as number).divide(100).format()
    },
    {
        field: "lastTransDate", headerName: "Last activity", flex: 10,
        valueFormatter: (v) =>
            new Date(v.value as unknown as string).toLocaleDateString()
    },
];


export default function AccountsPage() {
    const accounts = useObservable(() => listAccounts({}), []);
    const [selectedAccountGroup, setSelectedAccountGroup] = useState<AccountGroup | undefined>();

    const filteredAccounts = useMemo(() => {
        if (selectedAccountGroup && accounts.type === 'loaded') {
            return _.filter(
                accounts.data,
                ({name}) => _.sortedIndexOf(selectedAccountGroup.accounts, name) >= 0
            );
        } else if (accounts.type === 'loaded') {
            return accounts.data;
        } else {
            return [];
        }
    }, [accounts, selectedAccountGroup]);


    return <Container maxWidth="md" style={{display: "flex", flexWrap: 'wrap'}}>

        <AccountGroupSelect onSelected={setSelectedAccountGroup}
                            persistedKey="accountPageSelectedGroup" />

        <Box style={{width: '100%', height: 800, marginTop: 16}}>
            <DataGrid
                loading={accounts.type === 'loading'}
                error={accounts.type === 'error' ? accounts.error.message : undefined}
                columns={accountColumns}
                autoPageSize={true}
                density="compact"
                getRowId={(r) => r.name}
                rows={filteredAccounts}/>
        </Box>


    </Container>;
}
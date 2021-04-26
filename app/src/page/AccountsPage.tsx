import {Box, Container, useMediaQuery, useTheme} from "@material-ui/core";
import {DataGrid, GridColumns} from "@material-ui/data-grid";
import {useObservable} from "../hooks/useObservable";
import listAccounts from "../api/listAccount";
import currency from 'currency.js';
import {useMemo, useState} from "react";
import {AccountGroup} from "../models/AccountGroup";
import _ from "lodash";
import AccountGroupSelect from "../components/AccountGroupSelect";
import {flexContainer, flexFullLineItem} from "../styles/common";


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

    const isSmall = useMediaQuery('(max-width: 500px)');

    const accountColumns = useMemo(() => {
        const values: GridColumns = [
            {field: "name", headerName: "Name", flex: 1},
            {
                field: "balance", headerName: "Balance", width: 120,
                valueFormatter: (v) =>
                    currency(v.value as unknown as number).divide(100).format()
            }];
        if (!isSmall) {
            values.push({
                field: "lastTransDate", headerName: "Last activity", width: 140,
                valueFormatter: (v) =>
                    new Date(v.value as unknown as string).toLocaleDateString()
            });
        }
        return values;
    }, [isSmall]);


    return <Container maxWidth="md" style={flexContainer}>

        <AccountGroupSelect onSelected={setSelectedAccountGroup}
                            persistedKey="accountPageSelectedGroup" />

        <Box style={{...flexFullLineItem, height: 600}}>
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
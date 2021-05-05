import {flexContainer, flexFullLineItem} from "../styles/common";
import AccountGroupSelect from "../components/AccountGroupSelect";
import {useMemo, useState} from "react";
import {AccountGroup} from "../models/AccountGroup";
import {getLoadedValue, useObservable} from "../hooks/useObservable";
import listAccounts from "../api/listAccount";
import {Table} from "react-bootstrap";


export default function AccountListPage() {
    const [accountGroup, setAccountGroup] = useState<AccountGroup | undefined>();
    const allAccounts = useObservable(() => listAccounts({
        includes: accountGroup?.accounts,
    }), [accountGroup]);

    const children = useMemo(() => {
        return (getLoadedValue(allAccounts) ?? [])
            .map(({name, balance}) =>
                <tr>
                    <td>{name}</td>
                    <td>{balance.format()}</td>
                </tr>
            );
    }, [allAccounts]);

    return <div style={flexContainer}>
        <AccountGroupSelect
            style={{padding: 0}}
            onChange={setAccountGroup}/>

        <div style={flexFullLineItem}>
            <Table hover striped>
                <thead>
                <tr>
                    <th>Account</th>
                    <th>Balance</th>
                </tr>
                </thead>
                <tbody>
                {children}
                </tbody>
            </Table>
        </div>
    </div>;
}
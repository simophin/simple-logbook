import {flexContainer, flexFullLineItem} from "../styles/common";
import AccountGroupSelect from "../components/AccountGroupSelect";
import {useMemo, useState} from "react";
import {AccountGroup} from "../models/AccountGroup";
import {getLoadedValue, useObservable} from "../hooks/useObservable";
import listAccounts from "../api/listAccount";
import {Table} from "react-bootstrap";
import {Link} from 'react-router-dom';
import useAuthProps from "../hooks/useAuthProps";
import useObservableErrorReport from "../hooks/useObservableErrorReport";
import {Helmet} from "react-helmet";


export default function AccountListPage() {
    const [accountGroup, setAccountGroup] = useState<AccountGroup | undefined>();
    const authProps = useAuthProps();
    const allAccounts = useObservable(() => listAccounts({
        filter: {
            includes: accountGroup?.accounts,
        },
        ...authProps
    }), [accountGroup, authProps]);
    useObservableErrorReport(allAccounts);

    const children = useMemo(() => {
        return (getLoadedValue(allAccounts) ?? [])
            .map(({name, balance}) =>
                <tr key={`account-${name}`}>
                    <td><Link to={`/transactions?account=${encodeURIComponent(name)}`}>{name}</Link></td>
                    <td>{balance.format()}</td>
                </tr>
            );
    }, [allAccounts]);

    return <div style={flexContainer}>
        <Helmet><title>Accounts</title></Helmet>
        <AccountGroupSelect
            persistKey='account-list-group'
            style={{padding: 0}}
            onChange={setAccountGroup}/>

        <div style={flexFullLineItem}>
            <Table hover striped bordered size='sm'>
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
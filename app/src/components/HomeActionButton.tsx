import TransactionEntry from "./TransactionEntry";
import {useCallback, useContext, useState} from "react";
import {AppState} from "../state/AppState";
import {DropdownButton, NavDropdown} from "react-bootstrap";
import DropdownItem from "react-bootstrap/DropdownItem";
import AlertDialog from "./AlertDialog";


export default function HomeActionButton({asNav}: { asNav?: boolean }) {
    const [addingTransaction, setAddingTransaction] = useState(false);
    const {userState, reportTransactionUpdated, setUserState} = useContext(AppState);

    const handleNewTransactionClicked = useCallback(() =>
        setAddingTransaction(true), []);

    const [pendingLogoutConfirm, setPendingLogoutConfirm] = useState(false);
    const handleLogoutClicked = () => { setPendingLogoutConfirm(true) };

    return <>
        {asNav && <NavDropdown id="nav-dropdown" title='More'>
            <NavDropdown.Item onSelect={handleNewTransactionClicked}>
                New transaction
            </NavDropdown.Item>
            {userState?.state === 'with_token' && <NavDropdown.Item onSelect={handleLogoutClicked}>
                Log out
            </NavDropdown.Item>}
        </NavDropdown>}

        {!asNav && <DropdownButton title='More' size='sm' menuAlign='right'>
            <DropdownItem onSelect={handleNewTransactionClicked}>
                New transaction
            </DropdownItem>
            {userState?.state === 'with_token' && <DropdownItem onSelect={handleLogoutClicked}>
                Log out
            </DropdownItem>}
        </DropdownButton>}

        {addingTransaction && <TransactionEntry
            onFinish={reportTransactionUpdated}
            onClose={() => {
                setAddingTransaction(false);
            }}/>
        }

        {pendingLogoutConfirm &&
        <AlertDialog body='Are you sure to log out?'
                     onOk={() => {
                         setUserState(undefined);
                         setPendingLogoutConfirm(false);
                     }}
                     onCancel={() => setPendingLogoutConfirm(false)}
        />}
    </>;
}
import {LinkContainer} from "react-router-bootstrap";
import {NavDropdown} from "react-bootstrap";
import {useLocation} from "react-router-dom";
import {useContext, useState} from "react";
import TransactionEntry from "./TransactionEntry";
import {AppStateContext} from "../state/AppStateContext";


export default function TransactionNavDropdown() {
    const location = useLocation();
    const [addingTransaction, setAddingTransaction] = useState(false);
    const {reportTransactionUpdated} = useContext(AppStateContext);

    return <>
        <NavDropdown id='nav-transaction' title='Transaction'>
            <NavDropdown.Item onClick={() => setAddingTransaction(true)}>
                New transaction
            </NavDropdown.Item>

            <LinkContainer to='/transactions'>
                <NavDropdown.Item
                    active={location.pathname === '/' || location.pathname === '/transactions'}>
                    Transaction list
                </NavDropdown.Item>
            </LinkContainer>

            <LinkContainer to='/accounts'>
                <NavDropdown.Item
                    active={location.pathname === '/accounts'}>
                    Account list
                </NavDropdown.Item>
            </LinkContainer>

            <LinkContainer to='/attachments'>
                <NavDropdown.Item
                    active={location.pathname === '/attachments'}>
                    Attachment list
                </NavDropdown.Item>
            </LinkContainer>
        </NavDropdown>

        {addingTransaction && <TransactionEntry
            onFinish={reportTransactionUpdated}
            onClose={() => setAddingTransaction(false)}/>
        }
    </>;
}

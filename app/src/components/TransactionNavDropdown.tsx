import { LinkContainer } from "react-router-bootstrap";
import { NavDropdown } from "react-bootstrap";
import { useLocation } from "react-router-dom";
import { useContext, useState } from "react";
import TransactionEntry from "./TransactionEntry";
import { AppStateContext } from "../state/AppStateContext";


export default function TransactionNavDropdown() {
    const location = useLocation();
    const [addingTransaction, setAddingTransaction] = useState(false);
    const { reportTransactionUpdated } = useContext(AppStateContext);

    return <>
        <NavDropdown id='nav-transaction' title='Transaction'>
            <NavDropdown.Item onClick={() => setAddingTransaction(true)}>
                New transaction
            </NavDropdown.Item>

            <LinkContainer to='/transactions'>
                <NavDropdown.Item
                    active={location.pathname === '/' || location.pathname === '/transactions'}>
                    Transactions
                </NavDropdown.Item>
            </LinkContainer>

            <LinkContainer to='/tags'>
                <NavDropdown.Item
                    active={location.pathname === '/tags'}>
                    Tags
                </NavDropdown.Item>
            </LinkContainer>

            <LinkContainer to='/accounts'>
                <NavDropdown.Item
                    active={location.pathname === '/accounts'}>
                    Accounts
                </NavDropdown.Item>
            </LinkContainer>

            <LinkContainer to='/attachments'>
                <NavDropdown.Item
                    active={location.pathname === '/attachments'}>
                    Attachments
                </NavDropdown.Item>
            </LinkContainer>
        </NavDropdown>

        {addingTransaction && <TransactionEntry
            onFinish={reportTransactionUpdated}
            onClose={() => setAddingTransaction(false)} />
        }
    </>;
}

import {Box} from "@material-ui/core";
import {useCallback} from "react";
import {Transaction} from "../models/Transaction";
import {AccountBalance} from "../models/AccountBalance";
import {createTransaction} from "../api/createTransaction";
import {getAccountBalance} from "../api/getAccountBalance";
import TransactionEntry from "../components/TransactionEntry";


export default function NewTransactionPage() {
    const handleNewTxSubmit = useCallback(async (tx: Transaction): Promise<AccountBalance[]> => {
        await createTransaction(tx);
        return [
            await getAccountBalance(tx.fromAccount).toPromise(),
            await getAccountBalance(tx.toAccount).toPromise(),
        ]
    }, []);


    return <Box style={{
        maxWidth: 300,
        marginLeft: 'auto',
        marginRight: 'auto',
        marginTop: 8,
        marginBottom: 8,
    }
    }>
        <TransactionEntry onSubmit={handleNewTxSubmit} />
    </Box>
}
import {useParams} from 'react-router-dom';
import useAuthProps from "../hooks/useAuthProps";
import {useCallback} from "react";
import {listInvoice} from "../api/invoices";
import {map} from "rxjs/operators";
import LoadPage from "../components/LoadPage";
import InvoiceView from "../components/InvoiceView";
import {combineLatest} from "rxjs";
import {listInvoiceItems} from "../api/invoiceItems";
import {NonEmptyString} from "io-ts-types";
import {Helmet} from "react-helmet";


export default function InvoiceViewPage() {
    const params = useParams<{ id: string }>();
    const authProps = useAuthProps();
    const load = useCallback(({id, ...props}: typeof params & typeof authProps) => {
        return combineLatest([
            listInvoice({includes: [id]}, props),
            listInvoiceItems({invoiceIds: [id as NonEmptyString]})]
        ).pipe(map(([invoices, items]) => {
                if (invoices.data.length === 0) {
                    throw new Error(`Invoice with ID ${id} not found`);
                }
                return {invoice: invoices.data[0], items};
            }))
    }, []);

    return <LoadPage
        loadingProps={{...params, ...authProps}}
        loader={load}
        element={(props) => <>
            <Helmet title={`Invoice #${props.invoice.reference}`} />
            <InvoiceView {...props} />
        </>}/>
}
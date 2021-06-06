import {Helmet} from "react-helmet";
import InvoiceListView from "../components/InvoiceListView";

export default function InvoiceListPage() {
    return <>
        <Helmet title='Invoices' />
        <InvoiceListView />
    </>;
}
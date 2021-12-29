import { Form } from "react-bootstrap";
import Pagination from "react-js-pagination";
import { flexContainer, flexFullLineItem } from "../styles/common";

type Props = {
    onChange: (pageIndex: number) => unknown,
    currentPage: number,
    totalItemCount: number,
    pageSize: number,
};


export default function Paginator({ currentPage, onChange, totalItemCount, pageSize }: Props) {
    return <div style={flexContainer}>
        {totalItemCount > pageSize && <Pagination
            itemClass="page-item"
            linkClass="page-link"
            activePage={currentPage + 1}
            itemsCountPerPage={pageSize}
            totalItemsCount={totalItemCount}
            pageRangeDisplayed={5}
            onChange={(v) => onChange(v - 1)}
        />}

        <Form.Select>
            
        </Form.Select>
        <span>Total items: {totalItemCount}</span>
        
    </div>
}
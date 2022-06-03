import { useEffect, useMemo, useState } from "react";
import { Form } from "react-bootstrap";
import Pagination from "react-js-pagination";
import { flexContainer, flexFullLineItem, flexItem } from "../styles/common";

type Props = {
    onChange: (pageIndex: number, pageSize: number) => unknown,
    totalItemCount: number,
};

const pageSizeOptions = [10, 20, 50, 100];

export default function Paginator({ onChange, totalItemCount }: Props) {
    const [pageSize, setPageSize] = useState(pageSizeOptions[1]);
    const [currentPage, setCurrentPage] = useState(0);
    useEffect(() => {
        onChange(currentPage, pageSize);
    }, [pageSize, currentPage, onChange]);

    const options = useMemo(() => pageSizeOptions.map(opt => {
        return <option value={opt.toString()} key={opt.toString()}>{opt}pp</option>
    }), []);

    return <div style={{ ...flexFullLineItem, ...flexContainer }}>
        {totalItemCount > pageSize && <span style={flexItem}>
            <Pagination
                itemClass="page-item"
                linkClass="page-link"
                activePage={currentPage + 1}
                itemsCountPerPage={pageSize}
                totalItemsCount={totalItemCount}
                pageRangeDisplayed={5}
                onChange={(v) => setCurrentPage(v - 1)} />
        </span>}

        <span style={flexItem}>
            <Form.Select onChange={e => setPageSize(parseInt(e.target.value))}>
                {options}
            </Form.Select>
        </span>
    </div>
}
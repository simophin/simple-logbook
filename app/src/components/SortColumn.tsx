import { SortAscIcon, SortDescIcon } from "@primer/octicons-react";
import { Sort } from "../api/commonList";

type Props = {
    label: string,
    order: Sort['order'] | undefined,
    onChanged: (order: Sort['order'] | undefined) => unknown,
};

export default function SortColumn({ label, order, onChanged }: Props) {
    const toggleSort = () => {
        if (order === undefined) {
            onChanged('ASC');
        } else if (order === 'ASC') {
            onChanged('DESC');
        } else if (order === 'DESC') {
            onChanged(undefined);
        }
    };

    return <div style={{ display: 'flex', width: '100%' }}
        role='button'
        onClick={toggleSort}>
        <span style={{ flex: 1 }}>{label}</span>
        <span>
            {order === 'ASC' && <SortAscIcon size={16} />}
            {order === 'DESC' && <SortDescIcon size={16} />}
        </span>
    </div>;
}
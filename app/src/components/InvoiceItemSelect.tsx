import React, {CSSProperties, ReactElement, useContext, useEffect, useMemo, useState} from "react";
import SortedArray from "../utils/SortedArray";
import {InvoiceItem, listInvoiceItems} from "../api/invoiceItems";
import {getLoadedValue, useObservable} from "../hooks/useObservable";
import useAuthProps from "../hooks/useAuthProps";
import {map} from "rxjs/operators";
import {Button, Table} from "react-bootstrap";
import {Map as ImmutableMap} from 'immutable';
import {NonEmptyString} from "io-ts-types";
import {TriangleDownIcon, TriangleUpIcon} from "@primer/octicons-react";
import _ from "lodash";
import currency from "currency.js";
import {formatAsCurrency} from "../utils/numeric";
import InvoiceItemEntry from "./InvoiceItemEntry";
import {AppStateContext} from "../state/AppStateContext";
import {combineLatest} from "rxjs";

type Props = {
    selected: InvoiceItem['id'][],
    onChange: (selected: InvoiceItem['id'][]) => unknown,
    onSelectedAmountChanged: (total: currency) => unknown,
    invoiceId?: string,
};

type GroupRow = {
    name: string,
    children: Row[],
    totalPrice: currency,
    totalUnit: currency,
    unitPrice?: currency,
};

type Row = GroupRow | InvoiceItem;

type GroupRowBuilder = Pick<GroupRow, 'name'> & {
    childGroups: Map<string, GroupRowBuilder>,
    items: InvoiceItem[],
};

function isGroupSelected(row: GroupRow, selected: SortedArray<InvoiceItem['id']>) {
    for (const child of row.children) {
        if ("id" in child) {
            if (selected.find(child.id) < 0) {
                return false;
            }
        } else {
            if (!isGroupSelected(child, selected)) {
                return false;
            }
        }
    }
    return true;
}

function calculateSelectedValue(rows: Row[], selected: SortedArray<InvoiceItem['id']>, sum: currency = currency(0)) {
    for (const row of rows) {
        if ('id' in row) {
            if (selected.find(row.id) >= 0) {
                sum = sum.add(row.unit.multiply(row.unitPrice));
            }
        } else {
            sum = calculateSelectedValue(row.children, selected, sum);
        }
    }

    return sum;
}

function setGroupSelected(row: GroupRow, selected: boolean, selectedValues: SortedArray<InvoiceItem['id']>) {
    for (const child of row.children) {
        if ("id" in child) {
            const found = selectedValues.find(child.id);
            if (selected && found < 0) {
                selectedValues = selectedValues.insertAt(-found, child.id);
            } else if (!selected && found >= 0) {
                selectedValues = selectedValues.removeAt(found);
            }
        } else {
            selectedValues = setGroupSelected(child, selected, selectedValues);
        }
    }
    return selectedValues;
}

function rowBuilderToRow({childGroups, items, ...props}: GroupRowBuilder): GroupRow {
    let children: Row[] = [];
    let totalUnit = currency(0);
    let totalPrice = currency(0);
    let unitPrice: currency | undefined | null;

    for (const childGroup of childGroups.values()) {
        const row = rowBuilderToRow(childGroup);
        totalUnit = totalUnit.add(row.totalUnit);
        if (unitPrice && row.unitPrice && unitPrice.value !== row.unitPrice.value) {
            unitPrice = null;
        } else {
            unitPrice = row.unitPrice;
        }
        totalPrice = totalPrice.add(row.totalPrice);
        children.push(row);
    }

    for (const item of items) {
        totalUnit = totalUnit.add(item.unit);
        if (unitPrice && item.unitPrice && unitPrice.value !== item.unitPrice.value) {
            unitPrice = null;
        } else {
            unitPrice = item.unitPrice;
        }
        totalPrice = totalPrice.add(item.unitPrice.multiply(item.unit));
        children.push(item);
    }

    return {
        children,
        totalUnit,
        totalPrice,
        unitPrice: unitPrice ?? undefined,
        ...props
    };
}

function groupInvoiceItems(items: InvoiceItem[]): GroupRow[] {
    const root = new Map<string, GroupRowBuilder>();
    for (const item of items) {
        let categoryRow = root.get(item.category);
        if (!categoryRow) {
            root.set(item.category, categoryRow = {
                name: item.category,
                childGroups: new Map(),
                items: [],
            });
        }

        if (item.subCategory && item.subCategory.trim().length > 0) {
            let subCategoryRow = categoryRow.childGroups.get(item.subCategory);
            if (!subCategoryRow) {
                categoryRow.childGroups.set(item.subCategory, {
                    name: item.subCategory,
                    childGroups: new Map(),
                    items: [item],
                })
            } else {
                subCategoryRow.items.push(item);
            }
        } else {
            categoryRow.items.push(item);
        }
    }

    return Array.from(root.values()).map(rowBuilderToRow);
}


function getIndentPrefix(depth: number) {
    if (depth === 0) {
        return '';
    }

    return _.repeat('\u00A0', depth * 8);
}

const nameStyle: CSSProperties = {
    whiteSpace: 'nowrap'
};

function renderGroupRow(row: GroupRow,
                        groupId: string,
                        defaultExpanded: boolean,
                        selected: SortedArray<InvoiceItem['id']>,
                        setSelected: (v: InvoiceItem['id'][]) => unknown,
                        setExpandedGroups: (value: ImmutableMap<string, boolean>) => unknown,
                        expandedGroups: ImmutableMap<string, boolean>,
                        depth: number = 0): ReactElement {
    let isExpanded = expandedGroups.get(groupId);
    if (isExpanded === undefined) {
        isExpanded = defaultExpanded;
    }

    let checked = isGroupSelected(row, selected);

    const handleToggleExpand = (e: React.SyntheticEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setExpandedGroups(expandedGroups.set(groupId, !isExpanded));
    }

    const handleGroupToggleCheck = () => {
        setSelected(setGroupSelected(row, !checked, selected).backingArray());
    }

    const handleItemToggleCheck = (e: React.SyntheticEvent) => {
        const id = (e.currentTarget as HTMLElement).id;
        const found = selected.find(id);
        if (found >= 0) {
            setSelected(selected.removeAt(found).backingArray());
        } else if (found < 0) {
            setSelected(selected.insertAt(-found, id as NonEmptyString).backingArray());
        }
    };


    return <>
        <tr key={groupId} onClick={handleGroupToggleCheck}>
            <td><input type='checkbox' checked={checked}/></td>
            <td style={nameStyle}>
                {getIndentPrefix(depth)}
                {row.name}
                <span onClick={handleToggleExpand}>
                        {isExpanded ? <TriangleUpIcon size={18}/> : <TriangleDownIcon size={18}/>}
                </span>
            </td>
            <td/>
            <td>{row.totalUnit.toString()}</td>
            <td>{row.unitPrice ? formatAsCurrency(row.unitPrice) : '-'}</td>
            <td>{formatAsCurrency(row.totalPrice)}</td>
        </tr>
        {isExpanded && row.children.map((child) => {
            if ("id" in child) {
                const isSelected = selected.find(child.id) >= 0;
                return <tr key={child.id} id={child.id} onClick={handleItemToggleCheck}>
                    <td><input type='checkbox' checked={isSelected}/>
                    </td>
                    <td>{getIndentPrefix(depth + 1)}{child.description}</td>
                    <td>{new Date(child.date.toInstant().toEpochMilli()).toLocaleDateString()}</td>
                    <td>{child.unit.toString()}</td>
                    <td>{formatAsCurrency(child.unitPrice)}</td>
                    <td>{formatAsCurrency(child.unitPrice.multiply(child.unit))}</td>
                </tr>;
            } else {
                return renderGroupRow(child, groupId + '/' + child.name,
                    false, selected, setSelected, setExpandedGroups, expandedGroups, depth + 1)
            }
        })}
    </>;
}


export default function InvoiceItemSelect(
    {
        selected: rawSelected, onChange, onSelectedAmountChanged, invoiceId
    }
        : Props) {
    const selected = useMemo(() => new SortedArray(rawSelected), [rawSelected]);
    const authProps = useAuthProps();
    const {transactionUpdatedTime} = useContext(AppStateContext);

    const items = useObservable(() => {
        let rs$;
        if (invoiceId) {
            rs$ = combineLatest([
                listInvoiceItems({invoiceIds: []}, authProps),
                listInvoiceItems({invoiceIds: [invoiceId as NonEmptyString]}, authProps),
            ]).pipe(map(([first, second]) => [...first, ...second]));
        } else {
            rs$ = listInvoiceItems({invoiceIds: []}, authProps);
        }

        return rs$.pipe(map(groupInvoiceItems));
    }, [authProps, transactionUpdatedTime]);

    const [expandedGroups, setExpandedGroups] = useState(ImmutableMap<string, boolean>());

    const loadedItems = getLoadedValue(items);

    const rows = useMemo(() => loadedItems &&
        loadedItems.map((r) => renderGroupRow(r, r.name, true, selected, onChange, setExpandedGroups, expandedGroups)),
        [expandedGroups, loadedItems, onChange, selected]);

    const isAllSelected = (loadedItems && loadedItems.length > 0) ? isGroupSelected({
        name: 'root',
        children: loadedItems
    } as GroupRow, selected) : false;

    const toggleSelectAll = () => {
        if (loadedItems) {
            onChange(setGroupSelected({
                name: 'root',
                children: loadedItems
            } as GroupRow, !isAllSelected, selected).backingArray());
        }
    }

    const totalSelectedPrice = useMemo(() => loadedItems ? calculateSelectedValue(loadedItems, selected) : undefined,
        [loadedItems, selected]);

    useEffect(() => {
        totalSelectedPrice && onSelectedAmountChanged(totalSelectedPrice);
    }, [totalSelectedPrice, onSelectedAmountChanged]);

    const [addingItem, setAddingItem] = useState(false);

    return <>
        <Table hover size='sm' responsive>
            <thead>
            <tr>
                <th>{loadedItems && loadedItems.length > 0 &&
                <input type='checkbox' checked={isAllSelected} onChange={toggleSelectAll}/>}
                </th>
                <th>Description</th>
                <th>Date</th>
                <th>Unit</th>
                <th>Unit&nbsp;Price</th>
                <th>Total</th>
            </tr>
            </thead>
            <tbody>
            {rows}
            {loadedItems?.length === 0 && <tr>
                <td colSpan={6}>No items found</td>
            </tr>}
            </tbody>
            <tfoot>
            <tr>
                <td colSpan={6}>
                    {rows && rows.length > 0 && totalSelectedPrice && <div>
                        <b>Total selected: {formatAsCurrency(totalSelectedPrice)}</b>
                    </div>}
                    <Button
                        size='sm'
                        variant='outline-primary'
                        onClick={() => setAddingItem(true)}>Add a new item
                    </Button>
                </td>
            </tr>
            </tfoot>
        </Table>


        {addingItem && <InvoiceItemEntry draft={{state: 'new'}}
                                         onHide={() => setAddingItem(false)}/>}
    </>
}
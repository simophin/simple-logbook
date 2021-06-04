import {Invoice, InvoiceExtraCharge} from "../api/invoices";
import {flexContainer, flexFullLineItem} from "../styles/common";
import {InvoiceItem} from "../api/invoiceItems";
import {Table} from "react-bootstrap";
import {CSSProperties, useMemo} from "react";
import {formatAsLocaleLocalDate} from "../utils/dates";
import {formatAsCurrency} from "../utils/numeric";
import _ from "lodash";
import currency from "currency.js";

type Props = { invoice: Invoice, items: InvoiceItem[] };

const infoValueStyle: CSSProperties = {
    whiteSpace: 'nowrap',
};

const infoLabelStyle: CSSProperties = {
    whiteSpace: 'nowrap',
    fontWeight: 'bold'
}

type ItemRow = {
    desc: string,
    unit?: currency,
    unitPrice?: currency,
}

type ChargeRow = {
    name: string,
    amount: currency,
}

function mergeItems(items: InvoiceItem[]): ItemRow[] {
    return _.chain(items)
        .groupBy(({description, unitPrice}) => `${description.trim()}-${unitPrice.toString()}`.toLowerCase())
        .map(([first, ...others]) => ({
            desc: first.description,
            unit: _.reduce(others, (acc, item) => acc.add(item.unit), first.unit),
            unitPrice: first.unitPrice
        }))
        .value();
}

function indentDescription(rows: ItemRow[]) {
    const indentChars = _.repeat('\u00A0\u00A0\u00A0\u00A0', 2);
    for (const row of rows) {
        row.desc = indentChars + row.desc;
    }
    return rows;
}

function groupItems(items: InvoiceItem[]): ItemRow[] {
    return _.chain(items)
        .groupBy(({category}: InvoiceItem) => category.toLowerCase())
        .flatMap((subItems: InvoiceItem[]) => {
            return [
                {
                    desc: subItems[0].category,
                },
                ..._.chain(subItems)
                    .groupBy(({subCategory}: InvoiceItem) => subCategory.toLowerCase())
                    .flatMap((leafItems: InvoiceItem[]) => {
                        const merged = mergeItems(leafItems);
                        if (merged.length === 1) {
                            return indentDescription([{
                                ...merged[0],
                                desc: leafItems[0].subCategory
                            }]);
                        } else {
                            return indentDescription([
                                {desc: leafItems[0].subCategory},
                                ...indentDescription(merged)
                            ]);
                        }
                    })
                    .value()
            ];
        })
        .value();
}

function calcChargeRows(items: InvoiceItem[], extraCharges: InvoiceExtraCharge[]): ChargeRow[] {
    const rows: ChargeRow[] = [];
    let total = _.reduce(items, (acc, {unit, unitPrice}) => acc.add(unit.multiply(unitPrice)), currency(0));
    if (extraCharges.length > 0) {
        rows.push({
            name: 'Subtotal',
            amount: total,
        });
    }
    for (const charge of extraCharges) {
        if (charge.type === 'absolute') {
            total = total.add(charge.amount);
            rows.push({
                name: charge.name,
                amount: charge.amount as currency,
            })
        } else {
            const amount = total.multiply(currency(charge.amount as number).divide(100));
            rows.push({
                name: charge.name,
                amount,
            });
            total = total.add(amount);
        }
    }
    rows.push({
        name: 'Amount Due',
        amount: total,
    });

    return rows;
}


export default function InvoiceView({
                                        invoice: {
                                            client,
                                            clientDetails,
                                            companyName,
                                            date,
                                            dueDate,
                                            paymentInfo,
                                            extraCharges,
                                            extraInfo,
                                            reference,
                                            notes,
                                        }, items
                                    }: Props) {

    const amountWidth = 30;

    const invoiceInfo = useMemo(() => {
        const info: { label: string, value: string }[] = [];
        if (companyName.trim().length > 0) {
            info.push({label: 'From', value: companyName});
        }

        info.push(
            {label: 'Date', value: formatAsLocaleLocalDate(date)},
            {label: 'Invoice Number', value: reference.toString()},
            ...extraInfo.sort(({priority}) => priority)
                .map(({name, value}) => ({label: name, value}))
        );
        return info;
    }, [companyName, date, extraInfo, reference]);

    const headerTable = useMemo(() => {
        const [firstInfo, secondInfo, ...otherInfo] = invoiceInfo;
        return <Table borderless size='sm'>
            <tr key={firstInfo.label}>
                <td style={infoLabelStyle} rowSpan={otherInfo.length + 2}>To</td>
                <td style={{...infoValueStyle, width: '99%', whiteSpace: 'pre'}} rowSpan={otherInfo.length + 2}>
                    {client}<br/>{clientDetails}
                </td>
                <td style={infoLabelStyle}>{firstInfo.label}</td>
                <td style={infoValueStyle}>{firstInfo.value}</td>
            </tr>
            <tr key={secondInfo.label}>
                <td style={infoLabelStyle}>{secondInfo.label}</td>
                <td style={infoValueStyle}>{secondInfo.value}</td>
            </tr>
            {otherInfo.map(({label, value}) => <tr key={label}>
                <td style={infoLabelStyle}>{label}</td>
                <td style={infoValueStyle} valign='top'>{value}</td>
            </tr>)}
        </Table>
    }, [client, clientDetails, invoiceInfo]);

    const itemsTable = useMemo(() => {
        return <Table size='sm' striped>
            <thead>
            <tr>
                <th>Description</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Amount</th>
            </tr>
            </thead>
            <tbody>
            {groupItems(items).map(({desc, unit, unitPrice}) => <tr>
                <td>{desc}</td>
                <td>{unit?.toString()}</td>
                <td>{unitPrice ? formatAsCurrency(unitPrice) : ''}</td>
                <td width={amountWidth}
                    align='right'>{(unit && unitPrice) ? formatAsCurrency(unitPrice.multiply(unit)) : ''}</td>
            </tr>)}

            </tbody>
        </Table>
    }, [items]);

    const chargesTable = useMemo(() => {
        let allRows = calcChargeRows(items, extraCharges).map(({name, amount}) => <tr>
            <td style={infoLabelStyle} align='right'>{name}</td>
            <td style={infoValueStyle} align='right' width={amountWidth}>{formatAsCurrency(amount)}</td>
        </tr>);

        allRows = [...allRows.slice(0, allRows.length - 1),
            <tr><td colSpan={2}/></tr>, allRows[allRows.length - 1]];

        return <Table size='sm' borderless>{allRows}</Table>;
    }, [extraCharges, items]);

    return <div style={{...flexContainer, padding: 32}} id='printableArea'>
        <h2 style={{...flexFullLineItem, textAlign: 'center', marginBottom: 16}}>Invoice</h2>

        <div style={flexFullLineItem}>{headerTable}</div>
        <div style={flexFullLineItem}>{itemsTable}</div>
        <div style={flexFullLineItem}>{chargesTable}</div>

        {paymentInfo.length > 0 && <div style={flexFullLineItem}
                                        dangerouslySetInnerHTML={{__html: paymentInfo}} />}
        <div style={flexFullLineItem}>Due date: <b>{formatAsLocaleLocalDate(dueDate)}</b></div>
        {notes.length > 0 &&
        <div style={{...flexFullLineItem, marginTop: 16}}>
            Notes:<br />
            <div style={{whiteSpace: 'pre'}} dangerouslySetInnerHTML={{__html: notes}} />
        </div>
        }

    </div>;
}
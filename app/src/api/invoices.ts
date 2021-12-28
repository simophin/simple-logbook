import {ExtraRequestProps, request} from "./common";
import * as t from 'io-ts';
import config from "../config";
import {currencyType, localDateType, zonedDateTimeType} from "./codecs";
import {NonEmptyString} from "io-ts-types";
import {createEnumType} from "../utils/codecs";

const requestType = t.partial({
    q: t.string,
    from: localDateType,
    to: localDateType,
    limit: t.number,
    offset: t.number,
    includes: t.array(t.string),
});

export const allExtraChargeAmountTypes = ['percent', 'absolute'] as const;

export type ExtraChargeAmountType = typeof allExtraChargeAmountTypes[number];

export const extraChargeTypeType = createEnumType<ExtraChargeAmountType>(allExtraChargeAmountTypes);

const percentAmountType = t.type({
    amount: t.number,
    type: t.literal<ExtraChargeAmountType>('percent'),
});

const absoluteAmountType = t.type({
    amount: currencyType,
    type: t.literal<ExtraChargeAmountType>('absolute'),
});

const extraChargeType = t.intersection([
    t.type({
        name: NonEmptyString,
        description: t.string,
        priority: t.number,
    }),
    t.union([percentAmountType, absoluteAmountType])
]);

const extraInfoType = t.type({
    name: NonEmptyString,
    value: t.string,
    priority: t.number,
});

const invoiceType = t.type({
    id: NonEmptyString,
    client: t.string,
    clientDetails: t.string,
    date: zonedDateTimeType,
    dueDate: zonedDateTimeType,
    companyName: t.string,
    notes: t.string,
    items: t.array(NonEmptyString),
    extraCharges: t.array(extraChargeType),
    extraInfo: t.array(extraInfoType),
    attachments: t.array(NonEmptyString),
    amount: currencyType,
    reference: t.number,
    paymentInfo: t.string,
});

const responseType = t.type({
    total: t.number,
    data: t.array(invoiceType),
});

export type Invoice = t.TypeOf<typeof invoiceType>;
export type InvoiceExtraCharge = t.TypeOf<typeof extraChargeType>;
export type InvoiceExtraInfo = t.TypeOf<typeof extraInfoType>;

type Request = t.TypeOf<typeof requestType>;

export function listInvoice(req: Request, extraProps?: ExtraRequestProps) {
    return request({
        url: `${config.baseUrl}/invoices/list`,
        method: 'post',
        inputType: requestType,
        body: req,
        outputType: responseType,
        ...extraProps,
    });
}

export function saveInvoice(req: Invoice, extraProps?: ExtraRequestProps) {
    return request({
        url: `${config.baseUrl}/invoices`,
        method: 'post',
        inputType: invoiceType,
        body: req,
        outputType: t.unknown,
        ...extraProps,
    });
}

export function createInvoiceId(extraProps?: ExtraRequestProps) {
    return request({
        url: `${config.baseUrl}/invoices/id`,
        method: 'put',
        inputType: t.type({}),
        body: {},
        outputType: t.type({id: t.string}),
        ...extraProps,
    });
}

export function deleteInvoice(ids: string[], extraProps?: ExtraRequestProps) {
    return request({
        url: `${config.baseUrl}/invoices`,
        method: 'delete',
        inputType: t.type({ids: t.array(t.string)}),
        body: {ids},
        outputType: t.unknown,
        ...extraProps,
    });
}

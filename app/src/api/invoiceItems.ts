import * as t from 'io-ts';
import * as codec from 'io-ts-types';
import {currencyType, localDateType, zonedDateTimeType} from "./codecs";
import {ExtraRequestProps, request} from "./common";
import config from "../config";

const invoiceItemType = t.type({
    id: codec.NonEmptyString,
    category: codec.NonEmptyString,
    unit: currencyType,
    unitPrice: currencyType,
    date: zonedDateTimeType,
    attachments: t.array(codec.NonEmptyString),
    invoiceId: t.union([t.string, t.null]),
    description: t.string,
    subCategory: t.string,
    notes: t.string,
});

export type InvoiceItem = t.TypeOf<typeof invoiceItemType>;

export function saveInvoiceItem(req: InvoiceItem, extraProps?: ExtraRequestProps) {
    return request({
        inputType: invoiceItemType,
        body: req,
        url: `${config.baseUrl}/invoices/items`,
        method: 'post',
        outputType: t.unknown,
        ...extraProps,
    });
}

const filterType = t.partial({
    limit: t.number,
    q: t.string,
    from: localDateType,
    to: localDateType,
    invoiceIds: t.array(codec.NonEmptyString),
});

type Filter = t.TypeOf<typeof filterType>;

const listItemResponse = t.array(invoiceItemType);

export function listInvoiceItems(req: Filter, extraProps?: ExtraRequestProps) {
    return request({
        inputType: filterType,
        body: req,
        url: `${config.baseUrl}/invoices/items/list`,
        method: 'post',
        outputType: listItemResponse,
        ...extraProps,
    });
}

const searchCatRequest = t.partial({
    q: t.string,
    searchSubCategory: t.boolean
});

const searchCatResponse = t.array(codec.NonEmptyString);

export function searchItemCategories(req: t.TypeOf<typeof searchCatRequest>, extraProps?: ExtraRequestProps) {
    return request({
        url: `${config.baseUrl}/invoices/items/categories/search`,
        inputType: searchCatRequest,
        body: req,
        method: 'post',
        outputType: searchCatResponse,
        ...extraProps,
    });
}

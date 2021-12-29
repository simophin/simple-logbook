import * as t from 'io-ts';
import { localDateType } from './codecs';

const sortType = t.type({
    sort: t.string,
    order: t.union([t.literal('asc'), t.literal('desc')]),
});

export const commonListFilterType = t.partial({
    from: localDateType,
    to: localDateType,
    q: t.string,
    limit: t.number,
    offset: t.number,
    sorts: t.array(sortType)
})

export type CommonListFilter = t.TypeOf<typeof commonListFilterType>;
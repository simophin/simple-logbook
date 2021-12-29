import * as t from 'io-ts';
import { localDateType } from './codecs';

export const sortType = t.type({
    field: t.string,
    order: t.union([t.literal('ASC'), t.literal('DESC')]),
});

export type Sort = t.TypeOf<typeof sortType>;

export const commonListFilterType = t.partial({
    from: localDateType,
    to: localDateType,
    q: t.string,
    limit: t.number,
    offset: t.number,
    sorts: t.array(sortType)
})

export type CommonListFilter = t.TypeOf<typeof commonListFilterType>;
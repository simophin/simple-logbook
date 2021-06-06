import {HTMLAttributes, useCallback, useEffect, useMemo} from "react";
import {SeriesConfig, seriesConfigArrayType, SeriesEdit} from "./SeriesEdit";
import {v4 as uuid} from "uuid";
import _ from "lodash";
import {usePersistedState} from "../hooks/usePersistedState";


type Props = {
    persistKey?: string;
    onChange: (configs: SeriesConfig[]) => unknown;
    containerProps?: HTMLAttributes<HTMLDivElement>,
}

function findNextSeriesSequence(configs: SeriesConfig[]) {
    const seriesSeqPattern = /Series (\d+)/;
    return (_.max(configs.map(({name}) => {
        const matches = seriesSeqPattern.exec(name);
        if (matches) {
            return parseInt(matches[1]);
        }
        return 0;
    })) ?? 0) + 1;
}

export default function MultipleSeriesEdit({persistKey, onChange, containerProps}: Props) {
    const [seriesConfigs, setSeriesConfigs] = usePersistedState(persistKey, seriesConfigArrayType, () => {
        return [{
            accounts: [],
            name: `Series 1`,
            type: 'Expense',
            id: uuid(),
            visible: true,
        } as SeriesConfig];
    });

    useEffect(() => {
        onChange(seriesConfigs);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [seriesConfigs]);

    const handleRemoveSeries = useCallback((toRemove: SeriesConfig['id']) => {
        setSeriesConfigs(seriesConfigs.filter(({id}) => id !== toRemove));
    }, [seriesConfigs, setSeriesConfigs]);

    const handleAddSeries = useCallback(() => {
        setSeriesConfigs([...seriesConfigs, {
            accounts: [],
            name: `Series ${findNextSeriesSequence(seriesConfigs)}`,
            type: 'Expense',
            id: uuid(),
            visible: true,
        }]);
    }, [seriesConfigs, setSeriesConfigs]);

    const handleSeriesChange = useCallback(
        (c: SeriesConfig) => {
            const index = _.findIndex(seriesConfigs, ({id}) => id === c.id);
            if (index < 0) {
                return;
            }

            setSeriesConfigs([...seriesConfigs.slice(0, index), c, ...seriesConfigs.slice(index + 1)]);
        },
        [seriesConfigs, setSeriesConfigs]);

    const edits = useMemo(() => seriesConfigs.map(
        (c) =>
            <div {...containerProps} key={`series-edit-${c.id}`}><SeriesEdit value={c}
                             removable={seriesConfigs.length > 1}
                             removeSeries={handleRemoveSeries}
                             addSeries={handleAddSeries}
                             onChange={handleSeriesChange}/></div>),
        [containerProps, handleAddSeries, handleRemoveSeries, handleSeriesChange, seriesConfigs]);

    return <>{edits}</>
}
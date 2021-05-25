import {useContext, useMemo, useState} from "react";
import {flexContainer, flexFullLineItem, flexItem} from "../styles/common";
import {getSeriesColor, SeriesConfig} from "../components/SeriesEdit";
import MultipleSeriesEdit from "../components/MultipleSeriesEdit";
import {FrequencySelect} from "../components/FrequencySelect";
import {Observable} from "rxjs";
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from "recharts";
import currency from 'currency.js';
import {formatTimePoint, TimePoint, timePointFromValue, timePointToValue} from "../utils/TimePoint";
import {Button, ButtonGroup} from "react-bootstrap";
import {CategoricalChartProps} from "recharts/types/chart/generateCategoricalChart";
import {DateTimeFormatter} from "@js-joda/core";
import DateRangeSelect from "../components/DateRangeSelect";
import useWindowDimensions from "../hooks/useWindowDimensions";
import {AppStateContext} from "../state/AppStateContext";
import useAuthProps from "../hooks/useAuthProps";
import {getLoadedValue, useObservable} from "../hooks/useObservable";
import {ExtraRequestProps} from "../api/common";
import useObservableErrorReport from "../hooks/useObservableErrorReport";
import {Frequency} from "../models/frequency";

const allChartTypes = ['Area', 'Line', 'Bar'] as const;
type ChartType = typeof allChartTypes[number];

export type SeriesDataRequest = Pick<SeriesConfig, 'id'> & Pick<SeriesConfig, 'accounts'> & Pick<SeriesConfig, 'type'> & {
    from?: string,
    to?: string,
};

export type SeriesDataPoint = {
    timePoint: TimePoint,
    [id: string]: any,
}

export type SeriesData = SeriesDataPoint[];

type ChartProps = {
    data: SeriesData,
    configs: SeriesConfig[],
    freq: Frequency,
    type: ChartType,
};


function LinePart(c: SeriesConfig) {
    return <Line name={c.name}
                 dataKey={(v: SeriesDataPoint) => v[c.id] ?? 0}
                 key={c.id}
                 stroke={getSeriesColor(c)}
                 type='monotone'
                 dot={false}/>
}

function AreaPart(c: SeriesConfig) {
    const seriesColor = getSeriesColor(c);
    return <Area name={c.name}
                 key={c.id}
                 type='monotone'
                 fill={seriesColor}
                 stroke={seriesColor}
                 dataKey={(v: SeriesDataPoint) => v[c.id] ?? 0}
    />
}

function BarPart(c: SeriesConfig) {
    const seriesColor = getSeriesColor(c);
    return <Bar name={c.name}
                key={c.id}
                fill={seriesColor}
                color={seriesColor}
                stroke={seriesColor}
                dataKey={(v: SeriesDataPoint) => v[c.id] ?? 0}/>
}

function Chart({data, configs, freq, type}: ChartProps) {
    const chartProps: CategoricalChartProps = {
        width: 500,
        height: 400,
        data
    };

    const children = [
        <CartesianGrid key='chart-grid'/>,
        <XAxis key='chart-axis-x' dataKey={(p: SeriesDataPoint) => timePointToValue(p.timePoint)}
               tickFormatter={(value: string | number) =>
                   typeof value === 'string' ? value : formatTimePoint(timePointFromValue(value, freq))}
               style={{fontSize: 11}}/>,
        <YAxis key='chart-axis-y' tickFormatter={(v) => currency(v, {precision: 0}).format()} style={{fontSize: 11}}/>,
        <Tooltip key='chart-tooltip' formatter={(v: any) => currency(v).format()}
                 labelFormatter={(value: string | number) =>
                     typeof value === 'string' ? value : formatTimePoint(timePointFromValue(value, freq))}
        />,
        <Legend key='chart-legend'/>,
    ];

    switch (type) {
        case "Area":
            children.push(...configs.map(AreaPart));
            return <ResponsiveContainer>
                <AreaChart {...chartProps}>
                    {children}
                </AreaChart>
            </ResponsiveContainer>;
        case "Line":
            children.push(...configs.map(LinePart));
            return <ResponsiveContainer>
                <LineChart {...chartProps}>
                    {children}
                </LineChart>
            </ResponsiveContainer>;
        case "Bar":
            children.push(...configs.map(BarPart));
            return <ResponsiveContainer>
                <BarChart {...chartProps}>
                    {children}
                </BarChart>
            </ResponsiveContainer>;
    }
}




type Props = {
    fetchData: (request: SeriesDataRequest[], freq: Frequency, extraProps?: ExtraRequestProps) => Observable<SeriesData>,
    showFrequency?: boolean,
    persistKey: string,
};

export default function ChartPage({fetchData, showFrequency = true, persistKey}: Props) {
    const [seriesConfigs, setSeriesConfigs] = useState<SeriesConfig[]>([]);
    const [freq, setFreq] = useState<Frequency>('Monthly');
    const [chartType, setChartType] = useState<ChartType>('Line');
    const [from, setFrom] = useState<string>();
    const [to, setTo] = useState<string>();

    const {transactionUpdatedTime} = useContext(AppStateContext);

    const requests: SeriesDataRequest[] = useMemo(() => seriesConfigs.map(({id, type, accounts}) => {
        return {id, accounts, type, from, to};
    }), [from, seriesConfigs, to]);

    const authProps = useAuthProps();

    const seriesData = useObservable(() => fetchData(requests, freq, authProps),
        [requests, transactionUpdatedTime, authProps, freq]);

    useObservableErrorReport(seriesData);

    const {width: windowWidth} = useWindowDimensions();

    return <div style={flexContainer}>
        <div style={flexItem}>
            <ButtonGroup size='sm'>
                {allChartTypes.map(t =>
                    <Button key={`chart-type-${t}`} variant={t === chartType ? 'primary' : 'outline-primary'}
                            onClick={() => setChartType(t)}>
                        {t}
                    </Button>)
                }
            </ButtonGroup>
        </div>

        <div style={flexItem}>
            <DateRangeSelect
                persistKey={`${persistKey}-date-range`}
                onChange={({start, end}) => {
                    setFrom(start?.format(DateTimeFormatter.ISO_LOCAL_DATE));
                    setTo(end?.format(DateTimeFormatter.ISO_LOCAL_DATE));
                }}/>
        </div>

        {showFrequency && <div style={flexItem}>
            <FrequencySelect value={freq} onChange={setFreq}/>
        </div>}

        <MultipleSeriesEdit
            persistKey={`${persistKey}-page-series-config`}
            containerProps={{style: flexFullLineItem}}
            onChange={setSeriesConfigs}/>

        {getLoadedValue(seriesData)?.length !== 0 &&
        <div style={{...flexFullLineItem, maxWidth: Math.min(900, windowWidth), height: Math.min(900, windowWidth) * 9 / 16, minHeight: 300}}>
            <Chart data={getLoadedValue(seriesData)!!} configs={seriesConfigs} freq={freq} type={chartType}/>
        </div>
        }
    </div>;
}
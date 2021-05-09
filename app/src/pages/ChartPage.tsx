import {useContext, useEffect, useMemo, useState} from "react";
import * as SumReport from "../api/getSumReport";
import {flexContainer, flexFullLineItem, flexItem} from "../styles/common";
import {getSeriesColor, SeriesConfig} from "../components/SeriesEdit";
import MultipleSeriesEdit from "../components/MultipleSeriesEdit";
import {FrequencySelect} from "../components/FrequencySelect";
import {zip} from "rxjs";
import {TransactionStateContext} from "../state/TransactionState";
import {map, switchMap} from "rxjs/operators";
import {
    Area,
    ResponsiveContainer,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    Tooltip,
    XAxis,
    YAxis
} from "recharts";
import currency from 'currency.js';
import SortedArray from "../utils/SortedArray";
import {
    compareTimePoint,
    formatTimePoint,
    TimePoint,
    timePointFromString,
    timePointFromValue,
    timePointToValue
} from "../utils/TimePoint";
import {Button, ButtonGroup} from "react-bootstrap";
import {CategoricalChartProps} from "recharts/types/chart/generateCategoricalChart";
import {DateTimeFormatter, LocalDate} from "@js-joda/core";
import DateRangeSelect from "../components/DateRangeSelect";
import useWindowDimensions from "../hooks/useWindowDimensions";

const allChartTypes = ['Area', 'Line', 'Bar'] as const;
type ChartType = typeof allChartTypes[number];

type SeriesDataRequest = Pick<SeriesConfig, 'id'> & Pick<SeriesConfig, 'accounts'> & Pick<SeriesConfig, 'type'> & {
    from?: string,
    to?: string,
};

type SeriesDataPoint = {
    timePoint: TimePoint,
    [id: string]: any,
}

type SeriesData = SeriesDataPoint[];

type ChartProps = {
    data: SeriesData,
    configs: SeriesConfig[],
    freq: SumReport.Frequency,
    type: ChartType,
};


function LinePart(c: SeriesConfig) {
    return <Line name={c.name}
                 dataKey={(v: SeriesDataPoint) => v[c.id] ?? 0}
                 stroke={getSeriesColor(c)}
                 type='monotone'
                 dot={false}/>
}

function AreaPart(c: SeriesConfig) {
    const seriesColor = getSeriesColor(c);
    return <Area name={c.name}
                 type='monotone'
                 fill={seriesColor}
                 stroke={seriesColor}
                 dataKey={(v: SeriesDataPoint) => v[c.id] ?? 0}
    />
}

function BarPart(c: SeriesConfig) {
    const seriesColor = getSeriesColor(c);
    return <Bar name={c.name}
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
        <CartesianGrid/>,
        <XAxis dataKey={(p: SeriesDataPoint) => timePointToValue(p.timePoint)}
               tickFormatter={(value: string | number) =>
                   typeof value === 'string' ? value : formatTimePoint(timePointFromValue(value, freq))}
               style={{fontSize: 11}}/>,
        <YAxis tickFormatter={(v) => currency(v, {precision: 0}).format()} style={{fontSize: 11}}/>,
        <Tooltip formatter={(v: any) => currency(v).format()}
                 labelFormatter={(value: string | number) =>
                     typeof value === 'string' ? value : formatTimePoint(timePointFromValue(value, freq))}
        />,
        <Legend/>,
    ];

    switch (type) {
        case "Area":
            children.push(...configs.map(AreaPart));
            return <ResponsiveContainer><AreaChart {...chartProps}>
                {children}
            </AreaChart></ResponsiveContainer>;
        case "Line":
            children.push(...configs.map(LinePart));
            return <ResponsiveContainer><LineChart {...chartProps}>
                {children}
            </LineChart></ResponsiveContainer>;
        case "Bar":
            children.push(...configs.map(BarPart));
            return <ResponsiveContainer><BarChart {...chartProps}>
                {children}
            </BarChart></ResponsiveContainer>;
    }
}


function transformSum(resp: SumReport.ResponseType[],
                      reqs: SeriesDataRequest[],
                      freq: SumReport.Frequency): SeriesData {
    if (resp.length === 0) {
        return [];
    }

    let rs = new SortedArray<SeriesDataPoint>([], (lhs, rhs) =>
        compareTimePoint(lhs.timePoint, rhs.timePoint));

    for (let i = 0; i < resp.length; i++) {
        const report = resp[i];
        const req = reqs[i];
        const isIncome = req.type === 'Income';
        for (const item of report) {
            const timePoint = timePointFromString(item.timePoint, freq)!!;
            const value = isIncome ? -item.total.value : item.total.value;
            const index = rs.find(timePoint, (lhs, rhs) =>
                compareTimePoint(lhs, rhs.timePoint));
            if (index < 0) {
                const dp: SeriesDataPoint = {timePoint};
                dp[req.id] = value;
                rs = rs.insertAt(-index, dp);
            } else {
                rs.get(index)[req.id] = value;
            }
        }
    }

    return rs.backingArray();
}

export default function ChartPage() {
    const [seriesConfigs, setSeriesConfigs] = useState<SeriesConfig[]>([]);
    const [freq, setFreq] = useState<SumReport.Frequency>('Monthly');
    const [seriesData, setSeriesData] = useState<SeriesData>([]);
    const [chartType, setChartType] = useState<ChartType>('Line');
    const [from, setFrom] = useState<string>();
    const [to, setTo] = useState<string>();

    const txState = useContext(TransactionStateContext);

    const requests: SeriesDataRequest[] = useMemo(() => seriesConfigs.map(({id, type, accounts}) => {
        return {id, accounts, type, from, to};
    }), [from, seriesConfigs, to]);

    useEffect(() => {
        const sub = txState.pipe(
            switchMap(() => zip(
                ...requests.map((r) => SumReport.getSumReport({
                    ...r,
                    freq
                }))
            )),
            map((reports) => transformSum(reports, requests, freq)),
        ).subscribe(
            setSeriesData,
            (e) => {
            });
        return () => sub.unsubscribe();
    }, [txState, requests, freq]);

    const {width: windowWidth} = useWindowDimensions();

    return <div style={flexContainer}>
        <div style={flexItem}>
            <ButtonGroup size='sm'>
                {allChartTypes.map(t =>
                    <Button variant={t === chartType ? 'primary' : 'outline-primary'}
                            onClick={() => setChartType(t)}>
                        {t}
                    </Button>)
                }
            </ButtonGroup>
        </div>

        <div style={flexFullLineItem}>
            <DateRangeSelect
                persistKey='spending-date-range'
                onChange={({start, end}) => {
                setFrom(start?.format(DateTimeFormatter.ISO_LOCAL_DATE));
                setTo(end?.format(DateTimeFormatter.ISO_LOCAL_DATE));
            }} />
        </div>

        <div style={flexItem}>
            <FrequencySelect value={freq} onChange={setFreq}/>
        </div>

        <MultipleSeriesEdit
            persistKey='spending-page-series-config'
            containerProps={{style: flexFullLineItem}}
            onChange={setSeriesConfigs}/>

        {seriesData.length > 0 &&
        <div style={{...flexFullLineItem, height: windowWidth * 9 / 16, minHeight: 300}}>
            <Chart data={seriesData} configs={seriesConfigs} freq={freq} type={chartType}/>
        </div>
        }
    </div>;
}
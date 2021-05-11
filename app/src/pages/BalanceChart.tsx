import {Helmet} from "react-helmet";
import ChartPage, {SeriesData, SeriesDataPoint, SeriesDataRequest} from "./ChartPage";
import {Frequency} from "../models/frequency";
import {ExtraRequestProps} from "../api/common";
import * as BalanceReport from '../api/getBalanceReport';
import {zip} from "rxjs";
import {map, tap} from "rxjs/operators";
import SortedArray from "../utils/SortedArray";
import {compareTimePoint, TimePoint} from "../utils/TimePoint";
import {LocalDate} from "@js-joda/core";

function localDateToTimePoint(d: LocalDate): TimePoint {
    return {
        year: d.year(),
        dayOfYear: d.dayOfYear(),
    }
}

function computeReport(responses: BalanceReport.ResponseType[], requests: SeriesDataRequest[]): SeriesData {
    let rs = new SortedArray<SeriesDataPoint>([], (lhs, rhs) => compareTimePoint(lhs.timePoint, rhs.timePoint));
    const compareTimeToDataPoint = (tp: TimePoint, dp: SeriesDataPoint) => compareTimePoint(tp, dp.timePoint);
    for (let i = 0; i < responses.length; i++) {
        const resp = responses[i];
        const req = requests[i];
        const isIncome = req.type === 'Income';

        for (const {date, balance} of resp) {
            const timePoint = localDateToTimePoint(date);
            const index = rs.find(timePoint, compareTimeToDataPoint);
            if (index >= 0) {
                rs.get(index)[req.id] = isIncome ? -balance : balance;
            } else {
                const dp: SeriesDataPoint = {
                    timePoint
                };
                dp[req.id] = isIncome ? -balance : balance;
                rs = rs.insertAt(-index, dp);
            }
        }
    }

    // Fill the data gap
    const lastBalances: Record<SeriesDataRequest['id'], any> = {};
    for (let i = 0; i < rs.length; i++) {
        const dp = rs.get(i);
        for (const req of requests) {
            const seriesValue = dp[req.id];
            if (seriesValue) {
                lastBalances[req.id] = seriesValue;
            } else {
                dp[req.id] = lastBalances[req.id];
            }
        }
    }

    return rs.backingArray();
}

function fetch(requests: SeriesDataRequest[], _freq: Frequency, extraProps: ExtraRequestProps | undefined) {
    return zip(...requests.map((req) => BalanceReport.getBalanceReport(req, extraProps)))
        .pipe(
            map((responses) => computeReport(responses, requests)),
        );
}

export default function BalanceChart() {
    return <>
        <Helmet><title>Balance</title></Helmet>

        <ChartPage
            showFrequency={false}
            fetchData={fetch}
            persistKey='balance-chart'/>
    </>;
}
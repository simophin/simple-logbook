import ChartPage, {SeriesData, SeriesDataPoint, SeriesDataRequest} from "./ChartPage";
import * as SumReport from "../api/getSumReport";
import SortedArray from "../utils/SortedArray";
import {compareTimePoint, timePointFromString} from "../utils/TimePoint";
import {zip} from "rxjs";
import {Frequency} from "../models/frequency";
import {map} from "rxjs/operators";
import {Helmet} from "react-helmet";

function transformSum(resp: SumReport.Response[],
                      reqs: SeriesDataRequest[],
                      freq: Frequency): SeriesData {
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
            const timePoint = timePointFromString(item.timePoint, freq);
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

export default function IncomeExpenseChart() {
    return <>
        <Helmet><title>Income vs Expense</title></Helmet>
        <ChartPage
            showFrequency
            persistKey='spending-report'
            fetchData={(requests, freq, extraProps) => zip(
                ...requests.map((r) => SumReport.getSumReport({
                    ...r,
                    freq,
                    ...extraProps,
                }))
            ).pipe(map((reports) => transformSum(reports, requests, freq)))}/></>;
}
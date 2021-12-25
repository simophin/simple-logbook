import {ExtraRequestProps, request} from "./common";
import config from "../config";
import {accountGroupArrayType} from "../models/AccountGroup";

export default function listAccountGroups(extraProps?: ExtraRequestProps) {
    return request({
        url: `${config.baseUrl}/accountGroups`,
        method: 'get',
        outputType: accountGroupArrayType,
        ...extraProps,
    })
}

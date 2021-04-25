import {request} from "./common";
import config from "../config";
import {AccountGroupArrayType} from "../models/AccountGroup";

export default function listAccountGroups() {
    return request({
        url: `${config.baseUrl}/accountGroups`,
        method: 'get',
        ioType: AccountGroupArrayType,
    })
}
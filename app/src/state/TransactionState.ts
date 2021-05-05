import {createContext} from "react";
import {BehaviorSubject} from "rxjs";


export const TransactionStateContext = createContext(new BehaviorSubject<unknown>(undefined));
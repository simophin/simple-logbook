import {Any, TypeOf} from "io-ts";
import {useEffect, useState} from "react";


export default function useRemoteConfig<Type extends Any>(
    name: string,
    t: Type,
    initial: TypeOf<Type> | (() => TypeOf<Type>)) {
    const [value, setValue] = useState(initial);

    useEffect(() => {

    }, []);
}
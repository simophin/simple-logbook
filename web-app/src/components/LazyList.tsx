import { JSX } from "solid-js";

type MultipleProps = {
    count: number,
    key: (index: number) => any,
    children: (index: number) => JSX.Element,
}

type SingleProps = {
    children: () => JSX.Element | JSX.Element[],
}

type ItemDesc = SingleProps | MultipleProps;

type Props = {
    children: ItemDesc[],
};

export default function LazyList(props: Props) {
    return <>Hello, world</>;
}

LazyList.Item = function (props: SingleProps): ItemDesc {
    return props;
}

LazyList.Items = function (props: MultipleProps): ItemDesc {
    return props;
}
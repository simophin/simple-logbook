import { createMemo, JSX } from "solid-js";


type SingleItemProps = {
    key?: any,
    factory: () => JSX.Element,
}

type MultipleItemProps = {
    count: number,
    factory: (index: number) => JSX.Element,
    key?: (index: number) => any,
}

type BuilderProps = {
    item: (props: SingleItemProps) => unknown,
    items: (props: MultipleItemProps) => unknown,
}

type Props = {
    builder: (bp: BuilderProps) => unknown,
};

export default function LazyList(props: Props) {
    createMemo(() => {
        const items: Array<SingleItemProps | MultipleItemProps> = [];

        props.builder({
            item: (props) => items.push(props),
            items: (props) => items.push(props),
        });

        
    });


    return <>Hello, world</>;
}

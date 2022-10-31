import { createMemo, JSX, onMount } from "solid-js";


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
    item: (factory: () => JSX.Element, key?: any) => unknown,
    items: (count: number,
        factory: (index: number) => JSX.Element,
        key?: (index: number) => any) => unknown,
}

type Props = {
    builder: (bp: BuilderProps) => unknown,
};

export default function LazyList(props: Props) {
    let ele: HTMLDivElement = <div></div> as HTMLDivElement;

    const items = createMemo(() => {
        const items: Array<SingleItemProps | MultipleItemProps> = [];

        props.builder({
            item: (factory, key) => items.push({ factory, key }),
            items: (count, factory, key) => items.push({ count, factory, key }),
        });

        return items;
    });

    onMount(() => {
        console.log(`bounding of element:`, ele.getBoundingClientRect());
    });

    return ele;
}

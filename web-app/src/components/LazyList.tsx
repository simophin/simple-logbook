import { map, Observable } from "rxjs";
import { createEffect, createMemo, from, createSignal, JSX, onCleanup, onMount, splitProps } from "solid-js";


type SingleItemProps = {
    key?: any,
    factory: () => JSX.Element,
}

type GroupItemProps = {
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
    const root = <div class="flex-grow overflow-y-scroll"><div class="relative" /></div> as HTMLElement;
    const contentBox = root.firstChild as HTMLElement;

    const viewportHeight = from(observeResize(root).pipe(map(({ height }) => height)));
    const contentBoxRect = from(observeResize(contentBox));
    const scrollTop = from(observeEvent(root, 'scroll').pipe(map(() => root.scrollTop)));

    const items = createMemo(() => {
        const items: Array<SingleItemProps | GroupItemProps> = [];

        props.builder({
            item: (factory, key) => items.push({ factory, key }),
            items: (count, factory, key) => items.push({ count, factory, key }),
        });

        return items;
    });

    // Calculate what's in the content box
    createEffect(() => {

    });

    return root;
}

function observeResize(node: HTMLElement): Observable<DOMRectReadOnly> {
    return new Observable((e) => {
        const resizer = new ResizeObserver(([entry]) => e.next(entry.contentRect));
        resizer.observe(node);
        e.add(() => resizer.disconnect());
    });
}

function observeEvent(node: HTMLElement, type: keyof HTMLElementEventMap): Observable<Event> {
    return new Observable((e) => {
        const listener = (evt: Event) => e.next(evt);
        node.addEventListener(type, listener);
        e.add(() => node.removeEventListener(type, listener));
    });
}


function findStartItem(
    items: Array<SingleItemProps | GroupItemProps>,
    startKey: any,
) {
    let itemIndex = 0, indexInTotal = 0;
    for (let n = items.length; itemIndex < n; itemIndex++) {
        const item = items[itemIndex];
        if ('count' in item) {
            for (let i = 0, size = item.count; i < size; i++) {
                const itemKey = item.key?.(i) ?? indexInTotal;
                if (startKey === itemKey) {
                    return {
                        itemIndex,
                        offsetInGroup: i,
                        indexInTotal,
                    };
                }
                indexInTotal++;
            }
        } else {
            const itemKey = item.key ?? indexInTotal;
            if (startKey === itemKey) {
                return {
                    itemIndex,
                    indexInTotal,
                };
            }
            indexInTotal++;
        }
    }
}

function* iterateItems(
    items: Array<SingleItemProps | GroupItemProps>,
    params: { startKey: any, reverse?: boolean } | undefined,
): Generator<{ key: any, factory: () => JSX.Element }> {
    if (items.length === 0) {
        return;
    }

    const start = typeof params !== 'undefined' ? findStartItem(items, params.startKey) : undefined;
    const reverse = params?.reverse;

    let offsetInTotal = start?.indexInTotal ?? 0;
    if (reverse === true && start) {
        for (let i = start.itemIndex; i >= 0; i--) {
            const item = items[i];
            if ('count' in item) {
                for (let j = start.offsetInGroup ?? item.count - 1; j >= 0; j--) {
                    yield {
                        key: item.key?.(j) ?? offsetInTotal,
                        factory: () => item.factory(j),
                    };
                    offsetInTotal--;
                }
                start.offsetInGroup = undefined;
            } else {
                yield {
                    key: item.key ?? offsetInTotal,
                    factory: item.factory,
                };
                offsetInTotal--;
            }
        }
    } else if (reverse !== true) {
        for (let i = start?.itemIndex ?? 0, n = items.length; i < n; i++) {
            const item = items[i];
            if ('count' in item) {
                for (let j = start?.offsetInGroup ?? 0, size = item.count; j < size; j++) {
                    yield {
                        key: item.key?.(j) ?? offsetInTotal,
                        factory: () => item.factory(j),
                    };
                    offsetInTotal++;
                }

                if (start) {
                    start.offsetInGroup = undefined;
                }
            } else {
                yield {
                    key: item.key ?? offsetInTotal,
                    factory: item.factory,
                };
                offsetInTotal++;
            }
        }
    }
}
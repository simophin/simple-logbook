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
        console.log(
            'Scroll position:', scrollTop(),
            ', visibleHeight:', viewportHeight(),
            ', contentBox:', contentBoxRect()
        );

        contentBox.innerHTML = '';
        for (let index = 0; index < 1000; index++) {
            contentBox.appendChild(<div>{index}</div> as Node);
        }
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

function* iterateGroupItem(
    item: GroupItemProps,
    startOffset?: number,
    reverse?: boolean
) {
    if (typeof startOffset === 'number') {
        if (startOffset >= item.count || startOffset < 0) throw 'Out of range';
    } else {
        startOffset = item.count - 1;
    }

    if (reverse === true) {
        for (let i = startOffset; i >= 0; i--) {
            yield { key: item.key?.(i), factory: () => item.factory(i) }
        }
    } else {
        for (let i = startOffset, size = item.count; i < size; i++) {
            yield { key: item.key?.(i), factory: () => item.factory(i) }
        }
    }
}

function* iterateItems(
    items: Array<SingleItemProps | GroupItemProps>,
    startKey?: any,
    reverse?: boolean
): Generator<{ key: any, factory: () => JSX.Element }> {
    if (reverse == true) {

    } else {

    }


    let offset = 0;
    if (reverse === true) {
        for (let i = items.length - 1; i >= 0; i--) {
            const item = items[i];
            if ('count' in item) {
                for (let j = item.count - 1; j >= 0; j--) {
                    yield {
                        key: item.key?.(j),
                        factory: () => item.factory(j),
                        offset,
                    };
                    offset++;
                }
            } else {
                yield {
                    key: item.key,
                    factory: item.factory,
                    offset,
                };
                offset++;
            }
        }
    } else {
        for (const item of items) {
            if ('count' in item) {
                for (let i = 0, n = item.count; i < n; i++) {
                    yield {
                        key: item.key?.(i),
                        factory: () => item.factory(i),
                        offset,
                    };
                    offset++;
                }
            } else {
                yield {
                    key: item.key,
                    factory: item.factory,
                    offset,
                };
                offset++;
            }
        }
    }
}
import { map, Observable } from "rxjs";
import { createEffect, createMemo, from, createSignal, JSX, onCleanup, onMount, splitProps } from "solid-js";


type SingleItemProps = {
    key?: string,
    factory: () => JSX.Element,
}

type GroupItemProps = {
    count: number,
    factory: (index: number) => JSX.Element,
    key?: (index: number) => string,
}

type BuilderProps = {
    item: (factory: () => JSX.Element, key?: string) => unknown,
    items: (count: number,
        factory: (index: number) => JSX.Element,
        key?: (index: number) => string) => unknown,
}

type Props = {
    builder: (bp: BuilderProps) => unknown,
};

export default function LazyList(props: Props) {
    const root = <div class="flex-grow overflow-y-scroll">
        <div><div class="relative"></div></div>
    </div> as HTMLElement;
    const virtualBox = root.firstChild as HTMLElement;
    const contentBox = virtualBox.firstChild as HTMLElement;

    // const viewportHeight = from(observeResize(root).pipe(map(({ height }) => height)));
    // const contentBoxRect = from(observeResize(contentBox));
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
        const scrollY = scrollTop();

        const firstVisibleChild = findFirstVisible(root, contentBox.children);
        if (firstVisibleChild) {
            const contentTop = calcOffsetY(virtualBox, firstVisibleChild.child);
            contentBox.style.top = contentTop + 'px';
            while (contentBox.firstChild !== firstVisibleChild.child) {
                contentBox.removeChild(contentBox.firstChild!);
            }
        }

        const viewportHeight = root.getBoundingClientRect().height;
        if (contentBox.offsetHeight < viewportHeight * 3) {
            const startKey = (contentBox.lastChild as HTMLElement)?.dataset?.key;
            console.log('startKey =', startKey);
            for (const item of iterateItems(items(), startKey ? { startKey } : undefined)) {
                if (item.key !== startKey) {
                    console.log('Append node with key', item.key);
                    const node = item.factory() as HTMLElement;
                    node.dataset.key = item.key;
                    contentBox.appendChild(node);

                    if (contentBox.offsetHeight >= viewportHeight * 3) {
                        break;
                    }
                }
            }
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
                        key: item.key?.(j) ?? offsetInTotal.toString(),
                        factory: () => item.factory(j),
                    };
                    offsetInTotal--;
                }
                start.offsetInGroup = undefined;
            } else {
                yield {
                    key: item.key ?? offsetInTotal.toString(),
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
                        key: item.key?.(j) ?? offsetInTotal.toString(),
                        factory: () => item.factory(j),
                    };
                    offsetInTotal++;
                }

                if (start) {
                    start.offsetInGroup = undefined;
                }
            } else {
                yield {
                    key: item.key ?? offsetInTotal.toString(),
                    factory: item.factory,
                };
                offsetInTotal++;
            }
        }
    }
}

function findFirstVisible(target: HTMLElement, elementsToSearch: Iterable<Element>): {
    child: Element,
    offsetY: number,
} | undefined {
    const ourBounds = target.getBoundingClientRect();
    for (const ele of elementsToSearch) {
        const childRect = ele.getBoundingClientRect()
        if (intersects(childRect, ourBounds)) {
            return {
                child: ele,
                offsetY: childRect.top - ourBounds.top,
            }
        }
    }
}

// target - y
function calcOffsetY(base: Element, target: Element) {
    return target.getBoundingClientRect().top - base.getBoundingClientRect().top
}

function intersects(r1: DOMRectReadOnly, r2: DOMRectReadOnly) {
    const completelyOutside = r1.right < r2.left ||
        r1.left > r2.right ||
        r1.top > r2.bottom ||
        r1.bottom < r2.top;
    return !completelyOutside;
}
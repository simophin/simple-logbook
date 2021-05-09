function defaultCompare(lhs: any, rhs: any) {
    if (lhs < rhs) {
        return -1;
    } else if (lhs > rhs) {
        return 1;
    } else {
        return 0;
    }
}

export function binarySearch<T, R>(arr: T[], val: R, compareFn: (a: R, b: T) => number) {
    let start = 0;
    let end = arr.length - 1;

    while (start <= end) {
        const mid = Math.floor((start + end) / 2);
        const rc = compareFn(val, arr[mid]);

        if (rc < 0) {
            end = mid - 1;
        } else if (rc > 0) {
            start = mid + 1;
        } else {
            return mid;
        }
    }

    return -start - 1;
}

export default class SortedArray<T> {
    private readonly backing: T[];

    constructor(input: T[], private readonly compare: (lhs: T, rhs: T) => number = defaultCompare) {
        this.backing = [...input];
        this.backing.sort(this.compare);
    }

    get length() {
        return this.backing.length;
    }

    insertAt(index: number, v: T) {
        return new SortedArray([
            ...this.backing.slice(0, index),
            v,
            ...this.backing.slice(index)
        ], this.compare);
    }

    insert(v: T) {
        return this.insertAt(Math.abs(binarySearch(this.backing, v, this.compare)), v);
    }

    remove(v: T): [SortedArray<T>, boolean] {
        const existingIndex = binarySearch(this.backing, v, this.compare);
        if (existingIndex >= 0) {
            return [
                new SortedArray([
                    ...this.backing.slice(0, existingIndex),
                    ...this.backing.slice(existingIndex + 1)
                ], this.compare),
                true,
            ];
        }
        return [this, false];
    }

    has(v: T) {
        return binarySearch(this.backing, v, this.compare) >= 0;
    }

    find<V = T>(value: V, compareFn: (lhs: V, rhs: T) => number = this.compare as any) {
        return binarySearch(this.backing, value, compareFn);
    }

    get(index: number) {
        return this.backing[index];
    }

    backingArray() {
        return this.backing;
    }
}
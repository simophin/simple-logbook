import _ from "lodash";

export default class SortedArray<T> {
    private readonly backing: T[];

    constructor(input: T[]) {
        this.backing = _.sortBy(input);
    }

    private static _EMPTY = new SortedArray([]);

    static empty<T>() {
        return SortedArray._EMPTY as SortedArray<T>;
    }

    get length() {
        return this.backing.length;
    }

    insert(v: T) {
        let index = _.sortedIndex(this.backing, v);
        return new SortedArray([
            ...this.backing.slice(0, index),
            v,
            ...this.backing.slice(index)
        ]);
    }

    remove(v: T): [SortedArray<T>, boolean] {
        const existingIndex = _.sortedIndexOf(this.backing, v);
        if (existingIndex >= 0) {
            return [
                new SortedArray([
                    ...this.backing.slice(0, existingIndex),
                    ...this.backing.slice(existingIndex + 1)
                ]),
                true,
            ];
        }
        return [this, false];
    }

    has(v: T) {
        return _.sortedIndexOf(this.backing, v) >= 0;
    }

    get(index: number) {
        return this.backing[index];
    }
}
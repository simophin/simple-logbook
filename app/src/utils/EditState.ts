export type EditState<T> = {
    state: 'new'
} | {
    state: 'edit',
    editing: T,
} | {
    state: 'delete',
    deleting: T,
} | undefined;
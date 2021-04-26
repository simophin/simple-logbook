import {CSSProperties} from "react";

export const flexContainer = {
    display: 'flex',
    flexWrap: 'wrap',
    padding: 4,
} as CSSProperties;

export const fullWidth = {
    width: '100%',
} as CSSProperties;

export const flexItem = {
    margin: 8,
} as CSSProperties;

export const flexFullLineItem = {
    ...fullWidth,
    ...flexItem,
};
import { argbFromHex, hexFromArgb, themeFromSourceColor } from "@material/material-color-utilities";
import { createMemo, JSX } from "solid-js";
import { M3ColorType, M3ColorTypes } from "../Theme";

export interface ThemeData {
    colors: Record<M3ColorType, string>;
}

type Props = {
    dark?: boolean,
    primaryColor: string,
    children: JSX.Element | JSX.Element[],
}

export default function Themed(props: Props) {
    const styles = createMemo(() => {
        const { schemes } = themeFromSourceColor(argbFromHex(props.primaryColor));
        const s = props.dark == true ? schemes.dark : schemes.light;
        return M3ColorTypes.reduce((acc, t) => {
            acc[`--${t}`] = hexFromArgb(s[t]);
            return acc;
        }, {} as JSX.CSSProperties);
    });

    return <div style={styles()}>
        {props.children}
    </div >
}
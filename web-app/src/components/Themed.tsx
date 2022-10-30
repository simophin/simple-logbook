import { argbFromHex, hexFromArgb, themeFromSourceColor } from "@material/material-color-utilities";
import { createEffect, createMemo, JSX, useContext } from "solid-js";
import { M3ColorTypes } from "../Theme";
import { DarkModeContext } from "./DarkModeContext";


type Props = {
    primaryColor: string,
    children: JSX.Element | JSX.Element[],
    applyBodyBackground?: boolean,
}

export default function Themed(props: Props) {
    const darkMode = useContext(DarkModeContext);

    const colorSchemes = createMemo(() => {
        const {schemes} = themeFromSourceColor(argbFromHex(props.primaryColor));
        return darkMode() === 'dark' ? schemes.dark : schemes.light;
    })

    const styles = createMemo(() => {
        return M3ColorTypes.reduce((acc, t) => {
            acc[`--${t}`] = hexFromArgb(colorSchemes()[t]);
            return acc;
        }, {} as JSX.CSSProperties);
    });

    createEffect(() => {
        if (props.applyBodyBackground === true) {
            document.body.style.backgroundColor = hexFromArgb(colorSchemes().background);
        }
    });


    return <div style={styles()}>
        {props.children}
    </div >
}
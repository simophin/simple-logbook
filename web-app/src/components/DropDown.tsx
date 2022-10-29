import { JSX } from "solid-js"

type Props = {
    children: JSX.Element | JSX.Element[],
}

export function DropDown(props: Props) {
    return <span>{props.children}</span>;
}

DropDown.Menu = function (props: Props) {

}
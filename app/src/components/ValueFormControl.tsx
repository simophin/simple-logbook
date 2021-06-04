import {FormControl, FormControlProps} from "react-bootstrap";
import {HTMLProps} from "react";

type Props = {
    onValueChange?: (v: string) => unknown,
    pattern?: RegExp,
} & Omit<Omit<HTMLProps<'input'>, 'pattern'>, 'size'> & Omit<FormControlProps, 'pattern'>;


export default function ValueFormControl({onValueChange, pattern, ...props}: Props) {
    return <FormControl {...props}
        onChange={(e) => {
            if (onValueChange && (!pattern || e.target.value.length === 0 || pattern.test(e.target.value))) {
                onValueChange(e.target.value)
            }
        }}
    />;
}
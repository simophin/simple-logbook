import { FormControl, FormControlProps } from "react-bootstrap";
import { HTMLProps } from "react";
import React from "react";

type Props = {
    onValueChange?: (v: string) => unknown,
    pattern?: RegExp,
} & Omit<Omit<Omit<HTMLProps<'input'>, 'pattern'>, 'size'>, 'ref'> & Omit<FormControlProps, 'pattern'>;


const ValueFormControl = React.forwardRef(({ onValueChange, pattern, ...props }: Props, ref) => {
    return <FormControl {...props}
        ref={ref}
        onChange={(e) => {
            if (onValueChange && (!pattern || e.target.value.length === 0 || pattern.test(e.target.value))) {
                onValueChange(e.target.value)
            }
        }}
    />;
});

export default ValueFormControl;
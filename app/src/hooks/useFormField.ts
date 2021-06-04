import {useCallback, useMemo, useState} from "react";


type Rules = {
    pattern: RegExp,
    errorMessage?: string,
} | {
    required: boolean,
    errorMessage?: string,
} | {
    type: 'number',
    required?: boolean,
    min?: number,
    max?: number,
    errorMessage?: string,
} | {
    validate: (v: string) => string | null,
};

type ManualValidate = () => boolean;


export default function useFormField(defaultValue: string | (() => string), rules?: Rules):
    [string, (v: string, skipCheck?: boolean) => unknown, string | null, ManualValidate] {
    const [value, setValue] = useState(defaultValue);
    const [error, setError] = useState<string | null>(null);
    const validate = useCallback((v: string) => {
        const trimmedLength = v.trim().length;

        if (rules && "pattern" in rules) {
            const valid = rules.pattern.test(v);
            setError(valid ? null : (rules.errorMessage ?? `Incorrect format`));
            return valid;
        }

        if (rules && "validate" in rules) {
            const rs = rules.validate(v);
            setError(rs);
            return rs === null;
        }

        if (rules && "type" in rules && rules.type === 'number') {
            if (trimmedLength === 0 && rules.required) {
                setError(rules.errorMessage ?? 'This field is required');
                return false;
            } else if (trimmedLength !== 0) {
                const parsed = parseFloat(v);
                if (isNaN(parsed)) {
                    setError(rules.errorMessage ?? 'This value is not a number');
                    return false;
                }

                if (rules.min !== undefined && parsed < rules.min) {
                    setError(rules.errorMessage ?? 'This value is less than min value allowed');
                    return false;
                }

                if (rules.max !== undefined && parsed > rules.max) {
                    setError(rules.errorMessage ?? 'This value is bigger than max value allowed');
                    return false;
                }
            }
        }


        if (v.length > 0 && trimmedLength === 0) {
            setError('Whitespaces are not allowed');
            return false;
        }

        if (rules && "required" in rules && rules.required && trimmedLength === 0) {
            setError(rules.errorMessage ?? 'This field is required');
            return false;
        }

        setError(null);
        return true;
    }, [rules]);

    return useMemo(() => [value,
        (v: string, skipCheck?: boolean) => {
            setValue(v);

            if (skipCheck) {
                setError(null);
                return;
            }

            validate(v);
        },
        error,
        () => validate(value)], [error, validate, value]);
}

export function checkFormValidity(...validates: ManualValidate[]) {
    let valid = true;
    for (const validate of validates) {
        if (!validate()) {
            valid = false;
        }
    }
    return valid;
}
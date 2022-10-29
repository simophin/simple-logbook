import { createSignal, JSX, Show, splitProps } from "solid-js";


type Props = {
    needsAuth?: boolean,
    onPasswordSubmitted?: (pw: string) => unknown,
} & JSX.HTMLAttributes<HTMLDivElement>;

export default function AuthContainer(props: Props) {
    const [authProps, rest] = splitProps(props, ["needsAuth", "onPasswordSubmitted"]);
    const [pw, setPw] = createSignal('');

    return <div {...rest}>
        {props.children}
        <Show when={authProps.needsAuth}>

            <div class="w-full h-full absolute left-0 top-0 backdrop-blur-sm flex justify-center items-center">
                <form
                    onsubmit={(e) => {
                        e.preventDefault();
                        authProps.onPasswordSubmitted?.(pw());
                    }}
                    class="p-4 bg-surface text-onSurface border border-outline rounded-lg flex flex-col gap-3"
                >
                    <h2 class="text-xl font-semibold">Log in</h2>
                    <input name="password" class="p-2 text-medium w-50 border border-outlineVariant" type="password"
                        value={pw()}
                        onchange={e => setPw(e.currentTarget.value)}
                        placeholder="Password" autofocus />
                    <div class="flex justify-end">
                        <button type="submit" class="rounded-md bg-primary hover:bg-secondaryContainer hover:text-onSecondaryContainer p-2 text-onPrimary text-sm">Submit</button>
                    </div>
                </form>
            </div>
        </Show>
    </div>;
}

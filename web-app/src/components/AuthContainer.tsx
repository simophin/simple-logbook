import { createContext, createSignal, JSX, Show, useContext } from "solid-js";


type Props = {
    needsAuth?: boolean,
    onPasswordSubmitted?: (pw: string) => unknown,
} & JSX.HTMLAttributes<HTMLDivElement>;

export default function AuthContainer(props: Props) {
    const [pw, setPw] = createSignal('');

    return <div {...props}>
        {props.children}
        <Show when={props.needsAuth}>

            <div class="w-full h-full absolute left-0 top-0 backdrop-blur-sm flex justify-center items-center">
                <form
                    onsubmit={(e) => {
                        e.preventDefault();
                        props.onPasswordSubmitted?.(pw());
                    }}
                    class="p-4 bg-gray-100 border border-gray-200 rounded-lg flex flex-col gap-3"
                >
                    <h2 class="text-xl font-semibold">Log in</h2>
                    <input name="password" class="p-3 text-md" type="password"
                        value={pw()}
                        onchange={e => setPw(e.currentTarget.value)}
                        placeholder="Password" autofocus />
                    <div class="flex justify-end">
                        <button type="submit" class="rounded-md bg-slate-600 hover:bg-slate-700 p-2 text-white">Submit</button>
                    </div>
                </form>
            </div>
        </Show>
    </div>;
}

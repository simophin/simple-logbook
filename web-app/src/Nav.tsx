import { Component, createSignal, Show } from "solid-js"

type Props = {
    onAddRecordClicked: () => unknown,
}

export default function Nav(props: Props) {
    const [showRecordSub, setShowRecordSub] = createSignal(false);

    return <nav class="p-1 dark:bg-slate-700 flex">
        <label class="font-serif dark:text-white p-2">Logbook</label>

        <button
            onMouseEnter={() => setShowRecordSub(true)}
            onMouseLeave={() => setShowRecordSub(false)}
            class="dark:hover:text-white text-sm dark:text-zinc-300 p-2 inline-flex items-center">
            Records
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
                <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
            </svg>

            <Show when={showRecordSub()}>
                <div class="absolute rounded-sm top-10 dark:bg-slate-400 dark:text-white p-2">
                    <Button
                        onclick={() => {
                            setShowRecordSub(false);
                            props.onAddRecordClicked();
                        }}
                    >{() =>
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
                                <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                            </svg>
                            &nbsp;New
                        </>
                        }</Button>


                    <Button
                        onclick={() => {
                            setShowRecordSub(false);
                            props.onAddRecordClicked();
                        }}
                    >{() =>
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
                                <path fill-rule="evenodd" d="M6 4.75A.75.75 0 016.75 4h10.5a.75.75 0 010 1.5H6.75A.75.75 0 016 4.75zM6 10a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H6.75A.75.75 0 016 10zm0 5.25a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H6.75a.75.75 0 01-.75-.75zM1.99 4.75a1 1 0 011-1H3a1 1 0 011 1v.01a1 1 0 01-1 1h-.01a1 1 0 01-1-1v-.01zM1.99 15.25a1 1 0 011-1H3a1 1 0 011 1v.01a1 1 0 01-1 1h-.01a1 1 0 01-1-1v-.01zM1.99 10a1 1 0 011-1H3a1 1 0 011 1v.01a1 1 0 01-1 1h-.01a1 1 0 01-1-1V10z" clip-rule="evenodd" />
                            </svg>

                            &nbsp;List all
                        </>
                        }</Button>
                </div>
            </Show>
        </button>
    </nav>
}

type ButtonProps = {
    onclick: () => unknown,
    children: Component
}

function Button(props: ButtonProps) {
    return <button onclick={props.onclick}
        class="p-1 w-full rounded-sm dark:hover:bg-slate-500 text-start inline-flex">
        <props.children />
    </button>
}
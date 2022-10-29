import { Icon } from "solid-heroicons";
import { chevronDown, chevronUp, plusCircle, listBullet } from "solid-heroicons/solid-mini";
import { Component, createSignal, Show, JSX, createMemo } from "solid-js"
import { A, AnchorProps } from "@solidjs/router";

type Props = {
    onAddRecordClicked: () => unknown,
}

export default function Nav(props: Props) {
    const [showRecordSub, setShowRecordSub] = createSignal(false);

    function hideRecordSub(e?: unknown) {
        setShowRecordSub(false);
    }

    return <nav class="w-full fixed p-1 bg-gray-100 dark:bg-slate-700 items-center flex">
        <span class='w-3' />
        <label class="font-serif dark:text-white p-2">Logbook</label>
        <span class='w-3' />
        <span
            onMouseEnter={() => setShowRecordSub(true)}
            onMouseLeave={hideRecordSub}>

            <NavButton>
                Records
                <SmallIcon path={chevronDown} />
            </NavButton>

            <Show when={showRecordSub()}>
                <DropDownMenu>
                    <Button onclick={() => {
                        props.onAddRecordClicked()
                        hideRecordSub();
                    }}>
                        <SmallIcon path={plusCircle} />
                        New
                    </Button>

                    <Button onclick={hideRecordSub} as={A} href="/records" activeClass='text-sky-700'>
                        <SmallIcon path={listBullet} />
                        View all
                    </Button>
                </DropDownMenu>
            </Show>
        </span>

        <NavButton
            as={A}
            activeClass='text-sky-700'
            href='/accounts'>
            Accounts
        </NavButton>

        <NavButton>

        </NavButton>

    </nav>
}

type ButtonProps<T> = ({
    as?: Component<T>,
    class?: string,
} & T);

function NavButton<P extends {}>(props: ButtonProps<P>) {
    const As = props.as ?? ((p) => <span {...p} />);
    return <As {...props}
        role='button'
        class={`${props.class ?? ''} dark:hover:text-white text-sm dark:text-zinc-300 hover:text-sky-700 p-2 inline-flex items-center`}
    />;
}

function Button<P extends {}>(props: ButtonProps<P>) {
    const As = props.as ?? ((p) => <button {...p} />);
    return <As {...props}
        class={`${props.class ?? ''} p-1 w-full gap-2 rounded-sm text-sm hover:bg-gray-200 dark:hover:bg-slate-500 text-start inline-flex items-center`}
    />
}

function DropDown(props: {}) {

}

function DropDownMenu(props: JSX.HTMLAttributes<HTMLDivElement>) {
    return <div {...props}
        class={`${props.class} absolute rounded-sm top-10 bg-gray-100 dark:bg-slate-400 dark:text-white p-2`}
    />;
}

function SmallIcon(props: { path: { path: JSX.Element } }) {
    return <Icon path={props.path} class='w-4 h-4' />
}
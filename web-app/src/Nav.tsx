import { Icon } from "solid-heroicons";
import { chevronDown, chevronUp, plusCircle, listBullet, wrench as settings } from "solid-heroicons/solid-mini";
import { Component, createSignal, Show, JSX, createMemo, For } from "solid-js"
import { A, AnchorProps } from "@solidjs/router";

type Props = {
    onAddRecordClicked: () => unknown,
    charts?: Array<{
        icon?: string,
        title: string,
        id: string,
    }>,
}

export default function Nav(props: Props) {
    const activeLinkClass = 'text-sky-700 dark:text-white';

    return <nav class="w-full fixed p-1 bg-gray-100 dark:bg-slate-700 items-baseline flex">
        <span class='w-4' />
        <label class="font-serif text-xl dark:text-white p-1">Logbook</label>
        <span class='w-4' />

        <DropDown text='Records' icon={chevronDown}>
            {dismiss => <>
                <MenuItem onclick={() => {
                    props.onAddRecordClicked()
                    dismiss()
                }}>
                    <SmallIcon path={plusCircle} />
                    New record
                </MenuItem>

                <MenuItem onclick={dismiss}
                    as={A}
                    href="/records"
                    activeClass={activeLinkClass}>
                    <SmallIcon path={listBullet} />
                    View all
                </MenuItem>
            </>}
        </DropDown>

        <NavButton
            as={A}
            activeClass={activeLinkClass}
            href='/accounts'>
            Accounts
        </NavButton>

        <DropDown text='Charts' icon={chevronDown}>
            {dismiss => <>
                <For each={props.charts}>
                    {(item) => <MenuItem onclick={dismiss}
                        as={A}
                        href={`/chart/${item.id}`}
                        activeClass={activeLinkClass}>
                        {item.title}
                    </MenuItem>}
                </For>

                <Show when={props.charts?.length !== 0}>
                    <hr class="dark:border-slate-400" />
                </Show>

                <MenuItem onclick={dismiss}
                    as={A}
                    href="/charts/new"
                    activeClass={activeLinkClass}>
                    <SmallIcon path={plusCircle} />
                    New chart
                </MenuItem>
            </>}
        </DropDown>

        <span class="flex-grow" />

        <NavButton as={A} href="/settings">
            <SmallIcon path={settings} />
            Settings
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
        class={`${props.class ?? ''} dark:hover:text-white text-sm dark:text-zinc-300 hover:text-sky-700 p-2 inline-flex items-center gap-2`}
    />;
}

function MenuItem<P extends {}>(props: ButtonProps<P>) {
    const As = props.as ?? ((p) => <button {...p} />);
    return <As {...props}
        class={`${props.class ?? ''} p-2 w-full gap-2 rounded-sm text-sm hover:bg-gray-200 dark:hover:bg-slate-500 text-start inline-flex items-center`}
    />
}

type DropDownProps = {
    text: string,
    icon: { path: JSX.Element },
    children: (dismiss: () => unknown) => JSX.Element,
};

function DropDown(props: DropDownProps) {
    const [show, setShow] = createSignal(false);
    const dismiss = () => setShow(false);

    return <span
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}>

        <NavButton>
            {props.text}
            <SmallIcon path={props.icon} />
        </NavButton>

        <Show when={show()}>
            <div class='absolute rounded-sm top-10 bg-gray-100 dark:bg-slate-700 dark:text-white p-2'>
                {props.children(dismiss)}
            </div>
        </Show>
    </span>;
}


function SmallIcon(props: { path: { path: JSX.Element } }) {
    return <Icon path={props.path} class='w-4 h-4' />
}
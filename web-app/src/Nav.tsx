import { Icon } from "solid-heroicons";
import { chevronDown, chevronUp, plusCircle, listBullet, wrench as settings } from "solid-heroicons/solid-mini";
import { Component, createSignal, Show, JSX, createMemo, For, splitProps } from "solid-js"
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
    const activeLinkClass = 'font-bold';

    return <nav class="w-full fixed p-1 bg-primary text-onPrimary items-baseline flex">
        <span class='w-4' />
        <label class="font-serif text-xl p-1">Logbook</label>
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
                    <hr class="border-outlineVariant" />
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

type ButtonProps<P> = {
    as?: Component<P>,
    class?: string,
    children?: JSX.Element | JSX.Element[],
} & P;

function NavButton<P>(props: ButtonProps<P>) {
    const [as, rest] = splitProps(props, ["as", "class", "children"]);

    const As: Component<any> = as.as ?? ((p) => <span {...p} role='button' />);
    return <As {...rest}
        class={`${as.class ?? ''} hover:bg-secondaryContainer hover:text-onSecondaryContainer text-sm p-2 inline-flex items-center gap-2`}>
        {as.children}
    </As>
}

function MenuItem<P>(props: ButtonProps<P>) {
    const [as, rest] = splitProps(props, ["as", "class"]);
    const As: Component<any> = as.as ?? ((p) => <button {...p} />);
    return <As {...rest}
        class={`${as.class ?? ''} p-2 w-full gap-2 rounded-sm text-sm text-start inline-flex items-center hover:text-onSecondaryContainer hover:bg-secondaryContainer`}
    />
}

type DropDownProps = {
    text: string,
    icon: { path: JSX.Element },
    children: (dismiss: () => unknown) => JSX.Element,
};

function DropDown(props: DropDownProps) {
    const [show, setShow] = createSignal(false);

    return <span
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}>

        <NavButton>
            {props.text}
            <SmallIcon path={props.icon} />
        </NavButton>

        <Show when={show()}>
            <div class='absolute rounded-sm top-10 p-2 flex flex-col gap-1 bg-primary'>
                {props.children(() => setShow(false))}
            </div>
        </Show>
    </span>;
}


function SmallIcon(props: { path: { path: JSX.Element } }) {
    return <Icon path={props.path} class='w-4 h-4' />
}
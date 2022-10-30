import { A } from "@solidjs/router";
import { Icon } from "solid-heroicons";
import { chevronDown, listBullet, plusCircle, wrench as settings } from "solid-heroicons/solid-mini";
import { createSignal, For, JSX, Show, useContext } from "solid-js";
import { DarkModeContext } from "./components/DarkModeContext";

type Props = {
    onAddRecordClicked: () => unknown,
    charts?: Array<{
        icon?: string,
        title: string,
        id: string,
    }>,
    onToggleDarkTheme: () => unknown,
}

export default function Nav(props: Props) {
    const activeLinkClass = 'font-bold';
    const darkMode = useContext(DarkModeContext);

    return <nav class="w-full fixed p-1 bg-primary text-onPrimary items-center flex gap-2">
        <span class='w-2' />
        <label class="font-serif text-xl p-1">Logbook</label>
        <span class='w-2' />

        <DropDown text='Records' icon={chevronDown}>
            {dismiss => <>
                <button
                    class="btn-primary-filled"
                    onclick={() => {
                        props.onAddRecordClicked()
                        dismiss()
                    }}>
                    <SmallIcon path={plusCircle} />
                    New record
                </button>

                <A onclick={dismiss}
                    href="/records"
                    class="btn-primary-filled"
                    activeClass={activeLinkClass}>
                    <SmallIcon path={listBullet} />
                    View all
                </A>
            </>}
        </DropDown>

        <A
            activeClass={activeLinkClass}
            class="btn-primary-filled"
            href='/accounts'>
            Accounts
        </A>

        <DropDown text='Charts' icon={chevronDown}>
            {dismiss => <>
                <For each={props.charts}>
                    {(item) => <A onclick={dismiss}
                        href={`/chart/${item.id}`}
                        class="btn-primary-filled"
                        activeClass={activeLinkClass}>
                        {item.title}
                    </A>}
                </For>

                <Show when={props.charts?.length !== 0}>
                    <hr class="border-outlineVariant" />
                </Show>

                <A onclick={dismiss}
                    class="btn-primary-filled"
                    href="/charts/new"
                    activeClass={activeLinkClass}>
                    <SmallIcon path={plusCircle} />
                    New chart
                </A>
            </>}
        </DropDown>

        <span class="flex-grow" />

        <input type="checkbox" checked={darkMode() === 'dark'} onchange={(e) => {
            props.onToggleDarkTheme();
        }} />

        <A href="/settings" activeClass={activeLinkClass} class='btn-primary-filled'>
            <SmallIcon path={settings} />
            Settings
        </A>

    </nav>
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

        <button class='btn-primary-filled'>
            {props.text}
            <SmallIcon path={props.icon} />
        </button>

        <Show when={show()}>
            <div class='absolute rounded-sm top-9 p-2 flex flex-col gap-2 bg-primary'>
                {props.children(() => setShow(false))}
            </div>
        </Show>
    </span>;
}


function SmallIcon(props: { path: { path: JSX.Element } }) {
    return <Icon path={props.path} class='w-4 h-4' />
}
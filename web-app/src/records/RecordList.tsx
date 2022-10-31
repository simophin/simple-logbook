import LazyList from "../components/LazyList"

type Props = {

}


export default function RecordList(props: Props) {
    return <LazyList builder={({ item, items }) => {
        item(() => <div>First element</div>);
        items(100, (i) => <div>Element {i}</div>);
    }} />
}
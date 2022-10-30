import LazyList from "../components/LazyList"

type Props = {

}


export default function RecordList(props: Props) {
    return <LazyList>
        <LazyList.Item>
            <h1>Title</h1>
        </LazyList.Item>
    </LazyList>
}
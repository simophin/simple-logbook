import {flexContainer, flexFullLineItem, flexItem} from "../styles/common";
import {InputGroup} from "react-bootstrap";
import {ProjectIcon, SearchIcon} from "@primer/octicons-react";
import {useState} from "react";
import ValueFormControl from "../components/ValueFormControl";
import AccountSelect from "../components/AccountSelect";
import {Helmet} from "react-helmet";
import {useMediaPredicate} from "react-media-hook";


export default function AttachmentListPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [accounts, setAccounts] = useState<string[]>([]);
    const bigScreen = useMediaPredicate('(min-width: 420px)');


    return <div style={flexContainer}>
        <Helmet><title>Attachment list</title></Helmet>
        <InputGroup size='sm' as='div' style={bigScreen ? {...flexItem, flex: 1} : flexFullLineItem}>
            <InputGroup.Prepend>
                <InputGroup.Text><SearchIcon size={12}/></InputGroup.Text>
            </InputGroup.Prepend>
            <ValueFormControl value={searchTerm}
                              placeholder='Search'
                              onValueChange={setSearchTerm}/>
        </InputGroup>

        <InputGroup size='sm' as='div' style={bigScreen ? {...flexItem, flex: 1} : flexFullLineItem}>
            <InputGroup.Prepend>
                <InputGroup.Text><ProjectIcon size={12}/></InputGroup.Text>
            </InputGroup.Prepend>
            <AccountSelect
                placeholder='Accounts'
                onChange={setAccounts}
                selected={accounts}/>
        </InputGroup>
    </div>
}

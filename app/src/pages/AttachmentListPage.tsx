import {flexContainer, flexFullLineItem, flexItem} from "../styles/common";
import {InputGroup} from "react-bootstrap";
import {ProjectIcon, SearchIcon} from "@primer/octicons-react";
import {useState} from "react";
import ValueFormControl from "../components/ValueFormControl";
import AccountSelect from "../components/AccountSelect";
import {Helmet} from "react-helmet";
import {useMediaPredicate} from "react-media-hook";
import useAuthProps from "../hooks/useAuthProps";
import { useObservable } from "../hooks/useObservable";
import {searchAttachments} from "../api/listAttachment";


export default function AttachmentListPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [accounts, setAccounts] = useState<string[]>([]);
    const bigScreen = useMediaPredicate('(min-width: 420px)');
    const authProps = useAuthProps();
    const [currentPage, setCurrentPage] = useState(0);
    const attachments = useObservable(() => {
        let trimmedSearchTerm = searchTerm.trim();
        return searchAttachments({
            q: trimmedSearchTerm.length === 0 ? undefined : trimmedSearchTerm,
        });
    }, [authProps, currentPage, searchTerm, accounts]);

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

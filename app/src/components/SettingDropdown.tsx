import {NavDropdown} from "react-bootstrap";
import {useContext, useState} from "react";
import {AppStateContext} from "../state/AppStateContext";
import ChangePasswordDropdownItem from "./ChangePasswordDropdownItem";
import DropdownItem from "react-bootstrap/DropdownItem";
import AlertDialog from "./AlertDialog";

export default function SettingDropdown() {
    const {userState, setUserState} = useContext(AppStateContext);
    const [pendingLogoutConfirm, setPendingLogoutConfirm] = useState(false);
    const handleLogoutClicked = () => { setPendingLogoutConfirm(true) };

    return <NavDropdown id='nav-option' title='Settings'>
        <ChangePasswordDropdownItem />
        {userState?.state === 'with_token' && <DropdownItem onClick={handleLogoutClicked}>
            Log out
        </DropdownItem>}

        {pendingLogoutConfirm &&
        <AlertDialog body='Are you sure to log out?'
                     onOk={() => {
                         setUserState(undefined);
                         setPendingLogoutConfirm(false);
                     }}
                     onCancel={() => setPendingLogoutConfirm(false)}
        />}
    </NavDropdown>;
}
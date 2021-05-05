import {Button, Modal} from "react-bootstrap";
import {ButtonVariant} from "react-bootstrap/types";

export type Props = {
    onOk?: () => unknown,
    onCancel?: () => unknown,
    body: string,
    okText?: string,
    okVariant?: ButtonVariant,
    cancelText?: string,
    okLoading?: string,
};

export default function AlertDialog(
    {okText = 'OK', cancelText = 'Cancel', okLoading, body, onCancel, onOk, okVariant = 'primary'}: Props) {
    return <Modal onHide={onCancel} show autofocus>
        <Modal.Body>{body}</Modal.Body>
        <Modal.Footer>
            {(cancelText?.length ?? 0) > 0 &&
            <Button disabled={!!okLoading} variant='secondary' onClick={onCancel}>{cancelText}</Button>
            }

            <Button disabled={!!okLoading} variant={okVariant} onClick={onOk}>{okLoading ?? okText}</Button>
        </Modal.Footer>
    </Modal>
}
import React from 'react';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';

type Props = {
    title: string,
    body?: string,
    positiveButton: string,
    negativeButton: string,
    onClose?: () => void,
    onPositiveClicked: () => void,
    onNegativeClicked?: () => void,
}


export default function AlertDialog({
                                        title,
                                        body,
                                        positiveButton,
                                        negativeButton,
                                        onClose,
                                        onNegativeClicked,
                                        onPositiveClicked
                                    }: Props) {
    const [open, setOpen] = React.useState(true);
    const handleClose = () => {
        setOpen(false);
        if (onClose) onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
        >
            <DialogTitle id="alert-dialog-title">{title}</DialogTitle>
            {body && <DialogContent>
                <DialogContentText id="alert-dialog-description">
                    {body}
                </DialogContentText>
            </DialogContent>}
            <DialogActions>
                <Button onClick={() => {
                    if (onNegativeClicked) onNegativeClicked();
                    setOpen(false);
                }} color="primary">
                    {negativeButton}
                </Button>
                <Button onClick={() => {
                    onPositiveClicked();
                    setOpen(false);
                }} color="primary" autoFocus>
                    {positiveButton}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

import { useEffect, useState } from "react"
import Snackbar from '@mui/material/Snackbar';
import Alert, { AlertColor } from '@mui/material/Alert';
import { CustomEventKeys } from "@misc";

const Alerts = () => {
    const [open,setOpen] = useState(false)
    const [autoHideDuration,setAutoHideDuration] = useState<number|null>(null)
    const handleClose = () => setOpen(false)
    const [message,setMessage] = useState('')
    const [severity,setSeverity] = useState<AlertColor>('error')

    const openSnackbar = (
        duration:number|null,
        msg:string,
        sev:AlertColor,
    ) => {
        setAutoHideDuration(duration)
        setMessage(msg)
        setSeverity(sev)
        setOpen(true)
    }
    
    const onProductUpdateSuccessful = () => openSnackbar(6000,'Data update successful','success')
    const onProductUpdateFailed = () => openSnackbar(null,'Data update failed','error')
    const onPrinterDisconnected = () => openSnackbar(null, 'Printer Disconnected', 'error')
    const onPrinterServerOff = () => openSnackbar(null, 'Please Turn On Printer Server', 'error')
    const onNoOrderToUpload = () => openSnackbar(6000,'No order to upload','success')
    const onUploadSuccess = () => openSnackbar(6000, 'Upload successful', 'success')
    const onUploadFailed = () => openSnackbar(6000, 'Upload failed', 'error')

    useEffect(()=>{
        document.addEventListener(CustomEventKeys.PRODUCTS_UPDATE_SUCCESSFUL,onProductUpdateSuccessful)
        document.addEventListener(CustomEventKeys.PRODUCTS_UPDATE_FAILED,onProductUpdateFailed)
        document.addEventListener(CustomEventKeys.PRINTER_DISCONNECTED,onPrinterDisconnected)
        document.addEventListener(CustomEventKeys.PRINTER_SERVER_OFF, onPrinterServerOff)
        document.addEventListener(CustomEventKeys.NO_ORDER_TO_UPLOAD,onNoOrderToUpload)
        document.addEventListener(CustomEventKeys.UPLOAD_SUCCESS, onUploadSuccess)
        document.addEventListener(CustomEventKeys.UPLOAD_FAILED,onUploadFailed)

        return () => {
            document.removeEventListener(CustomEventKeys.PRODUCTS_UPDATE_SUCCESSFUL,onProductUpdateSuccessful)
            document.removeEventListener(CustomEventKeys.PRODUCTS_UPDATE_FAILED,onProductUpdateFailed)
            document.removeEventListener(CustomEventKeys.PRINTER_DISCONNECTED,onPrinterDisconnected)
            document.removeEventListener(CustomEventKeys.PRINTER_SERVER_OFF, onPrinterServerOff)
            document.removeEventListener(CustomEventKeys.NO_ORDER_TO_UPLOAD,onNoOrderToUpload)
            document.removeEventListener(CustomEventKeys.UPLOAD_SUCCESS, onUploadSuccess)
            document.removeEventListener(CustomEventKeys.UPLOAD_FAILED,onUploadFailed)
        }
    },[])

    return (
        <Snackbar open={open} autoHideDuration={autoHideDuration} onClose={handleClose}>
            <Alert
                onClose={handleClose}
                severity={severity}
                variant="filled"
                sx={{ width: '100%' }}
            >
                {message}
            </Alert>
        </Snackbar>
    )
}

export default Alerts
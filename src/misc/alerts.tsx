import { useEffect, useState } from "react"
import Snackbar from '@mui/material/Snackbar';
import Alert, { AlertColor } from '@mui/material/Alert';
import { CustomEventKeys } from "@misc";
import { IAlertMessage } from "../interfaces";
import { IWorkerMessage } from "@components/orders/interface";

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
    const onStockUpdateReport = (e:CustomEvent<IAlertMessage>) => {
        const {message,color} = e.detail
        openSnackbar(6000, message, color)
    }

    const onOrderUpdate = (e:CustomEvent<IWorkerMessage>) => openSnackbar(6000, `${e.detail.str} update ${e.detail.success ? 'successful' : 'failed'}`, e.detail.success ? 'success' : 'error')
    const onRefundUploaded = () => openSnackbar(6000, 'Refund uploaded', 'success')
    const onOrderUploaded = (e:CustomEvent<string>) => openSnackbar(6000,`${e.detail} uploaded`, 'success')
    const onRegularUploadComplete = () => openSnackbar(6000, 'Regular upload complete','success')

    useEffect(()=>{
        document.addEventListener(CustomEventKeys.PRODUCTS_UPDATE_SUCCESSFUL,onProductUpdateSuccessful)
        document.addEventListener(CustomEventKeys.PRODUCTS_UPDATE_FAILED,onProductUpdateFailed)
        document.addEventListener(CustomEventKeys.PRINTER_DISCONNECTED,onPrinterDisconnected)
        document.addEventListener(CustomEventKeys.PRINTER_SERVER_OFF, onPrinterServerOff)
        document.addEventListener(CustomEventKeys.NO_ORDER_TO_UPLOAD,onNoOrderToUpload)
        document.addEventListener(CustomEventKeys.UPLOAD_SUCCESS, onUploadSuccess)
        document.addEventListener(CustomEventKeys.UPLOAD_FAILED,onUploadFailed)
        document.addEventListener(CustomEventKeys.STOCK_UPDATE_REPORT,onStockUpdateReport)
        document.addEventListener(CustomEventKeys.ORDER_UPDATE_REPORT,onOrderUpdate)
        document.addEventListener(CustomEventKeys.REFUND_UPLOADED,onRefundUploaded)
        document.addEventListener(CustomEventKeys.ORDER_UPLOADED,onOrderUploaded)
        document.addEventListener(CustomEventKeys.REGULAR_UPLOAD_COMPLETE,onRegularUploadComplete)

        return () => {
            document.removeEventListener(CustomEventKeys.PRODUCTS_UPDATE_SUCCESSFUL,onProductUpdateSuccessful)
            document.removeEventListener(CustomEventKeys.PRODUCTS_UPDATE_FAILED,onProductUpdateFailed)
            document.removeEventListener(CustomEventKeys.PRINTER_DISCONNECTED,onPrinterDisconnected)
            document.removeEventListener(CustomEventKeys.PRINTER_SERVER_OFF, onPrinterServerOff)
            document.removeEventListener(CustomEventKeys.NO_ORDER_TO_UPLOAD,onNoOrderToUpload)
            document.removeEventListener(CustomEventKeys.UPLOAD_SUCCESS, onUploadSuccess)
            document.removeEventListener(CustomEventKeys.UPLOAD_FAILED,onUploadFailed)
            document.removeEventListener(CustomEventKeys.STOCK_UPDATE_REPORT,onStockUpdateReport)
            document.removeEventListener(CustomEventKeys.ORDER_UPDATE_REPORT,onOrderUpdate)
            document.removeEventListener(CustomEventKeys.REFUND_UPLOADED,onRefundUploaded)
            document.removeEventListener(CustomEventKeys.ORDER_UPLOADED,onOrderUploaded)
            document.removeEventListener(CustomEventKeys.REGULAR_UPLOAD_COMPLETE,onRegularUploadComplete)
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
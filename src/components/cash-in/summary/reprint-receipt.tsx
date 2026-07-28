import Button from "@mui/material/Button"
import PrintIcon from '@mui/icons-material/Print';
import { useContext, useEffect, useRef } from "react";
import Context from "@components/contexts";
import { IDB } from "../../../hooks/class-db";
import { IOrder, StoreNames } from "../../../interfaces";
import { CustomEventKeys, dispatchNewEvent } from "@misc";
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';

const ReprintReceipt = () => {
    const {currentOrderID} = useContext(Context)
    const idb = useRef<IDB>(null)
    const initDB = async() => {
        idb.current = new IDB()
        await idb.current.initDB()
    }
    const onClick = async(isGiftReceipt:boolean) => {
        const printerOK = await idb.current.checkPrinterStatus()
        if (!printerOK) return
        
        try {
            const order = await idb.current.getItem(currentOrderID,StoreNames.Orders) as IOrder
            const {completeOrderNumber} = order
            dispatchNewEvent(CustomEventKeys.PRINTING_START)
            await idb.current.printingReceiptFromDB(completeOrderNumber,isGiftReceipt)
            dispatchNewEvent(CustomEventKeys.PRINTING_END)
        } catch (e) {}
    }

    useEffect(()=>{
        initDB()
    },[])

    return (
        <>
        <Button
            variant="contained"
            color='secondary'
            sx={{fontSize:'1.4rem',letterSpacing:'0.3rem'}}
            startIcon={<CardGiftcardIcon sx={{scale:1.4,mr:2}} />}
            onClick={()=>onClick(true)}
        >Gift</Button>
        <Button
            variant="contained"
            sx={{fontSize:'1.4rem',letterSpacing:'0.3rem'}}
            startIcon={<PrintIcon sx={{scale:1.4,mr:2}} />}
            onClick={()=>onClick(false)}
        >REPRINT</Button>
        </>
    )
}

export default ReprintReceipt
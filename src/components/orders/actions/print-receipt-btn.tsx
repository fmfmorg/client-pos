import Button from "@mui/material/Button"
import PrintIcon from '@mui/icons-material/Print';
import { useContext, useEffect, useRef } from "react";
import { IDB } from "../../../hooks/class-db";
import { OrderNumberContext } from "@components/orders/contexts";
import { CustomEventKeys, dispatchNewEvent } from "@misc";
import Stack from "@mui/material/Stack";
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';

const PrintReceiptBtn = () => {
    const {orderNumber} = useContext(OrderNumberContext)
    const idb = useRef<IDB>(null)
    const initDB = async() => {
        idb.current = new IDB()
        await idb.current.initDB()
    }
    const onClick = async(isGiftReceipt:boolean) => {
        const printerOK = await idb.current.checkPrinterStatus()
        if (!printerOK) return
        
        try {
            dispatchNewEvent(CustomEventKeys.PRINTING_START)
            await idb.current.printingReceiptFromDB(orderNumber,isGiftReceipt)
            dispatchNewEvent(CustomEventKeys.PRINTING_END)
        } catch (e) {}
    }

    useEffect(()=>{
        initDB()
    },[])

    return (
        <Stack sx={{px:1}} rowGap={2}>
            <Button 
                variant="contained" 
                color="warning"
                startIcon={<CardGiftcardIcon sx={{scale:1.4,mr:2}} />}
                sx={{fontSize:'1.4rem',letterSpacing:'0.3rem'}}
                onClick={()=>onClick(true)}
                fullWidth
            >Gift Receipt</Button>
            <Button 
                variant="contained" 
                startIcon={<PrintIcon sx={{scale:1.4,mr:2}} />}
                sx={{fontSize:'1.4rem',letterSpacing:'0.3rem'}}
                onClick={()=>onClick(false)}
                fullWidth
            >Print Receipt</Button>
        </Stack>
    )
}

export default PrintReceiptBtn
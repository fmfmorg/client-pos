import Button from "@mui/material/Button"
import LocalPrintshopIcon from '@mui/icons-material/LocalPrintshop';
import { useContext, useEffect, useRef } from "react";
import { IDB } from "../../../hooks/class-db";
import Context from "@components/contexts";
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';

const SubmitCardOrderBtn = () => {
    const {currentOrderID} = useContext(Context)
    const idb = useRef<IDB>(null)
    const initDB = async() => {
        idb.current = new IDB()
        await idb.current.initDB()
    }
    const onClick = async(isGiftReceipt:boolean) => await idb.current.submitOrder(currentOrderID,2,isGiftReceipt)

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
            startIcon={<LocalPrintshopIcon sx={{scale:1.4,mr:2}} />}
            onClick={()=>onClick(false)}
        >Print</Button>
        </>
    )
}

export default SubmitCardOrderBtn
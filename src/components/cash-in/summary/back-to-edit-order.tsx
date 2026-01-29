import Button from "@mui/material/Button";
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import { OrderStatusEnum } from "src/misc/order-status";
import { useContext, useEffect, useRef } from "react";
import { IDB } from "src/hooks/class-db";
import Context from "@components/contexts";

const BackToEditOrderBtn = () => {
    const {currentOrderID} = useContext(Context)
    const idb = useRef<IDB>(null)
    const initDB = async() => {
        idb.current = new IDB()
        await idb.current.initDB()
    }
    const onClick = async () => await idb.current.updateOrderStatus(currentOrderID,OrderStatusEnum.EDITING)
    const backspaceOnPress = async(e:KeyboardEvent) => {
        if (e.key.toLowerCase() === 'backspace' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey){
            e.preventDefault()
            await idb.current.updateOrderStatus(currentOrderID,OrderStatusEnum.EDITING)
        }
    }

    useEffect(()=>{
        initDB()
        window.addEventListener('keydown',backspaceOnPress)

        return () => {
            window.removeEventListener('keydown',backspaceOnPress)
        }
    },[])

    return (
        <Button
            variant="contained"
            color='warning'
            onClick={onClick}
            sx={{fontSize:'1.4rem',letterSpacing:'0.3rem'}}
            startIcon={<ArrowBackRoundedIcon sx={{scale:1.4,mr:2}} />}
        >Back</Button>
    )
}

export default BackToEditOrderBtn
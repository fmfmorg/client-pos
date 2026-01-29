import Button from "@mui/material/Button"
import CreditCardIcon from '@mui/icons-material/CreditCard';
import { useContext, useEffect, useRef } from "react";
import { IDB } from "src/hooks/class-db";
import Context from "@components/contexts";
import { OrderStatusEnum } from "src/misc/order-status";

const CardBtn = () => {
    const {currentOrderID} = useContext(Context)
    const idb = useRef<IDB>(null)
    const initDB = async() => {
        idb.current = new IDB()
        await idb.current.initDB()
    }
    const onClick = async() => idb.current.updateOrderStatus(currentOrderID,OrderStatusEnum.READY_CARD) //await idb.current.submitOrder(currentOrderID,2)

    useEffect(()=>{
        initDB()
    },[])

    return (
        <Button 
            fullWidth 
            variant='contained' 
            sx={{fontSize:'1.4rem',letterSpacing:'0.3rem'}}
            startIcon={<CreditCardIcon sx={{scale:1.4,mr:2}} />}
            onClick={onClick}
        >Card</Button>
    )
}

export default CardBtn
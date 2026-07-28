import { CustomEventKeys, dispatchNewEvent } from "@misc";
import Button from "@mui/material/Button"
import { useEffect, useRef } from "react";
import { IDB } from "../../../hooks/class-db";
import { CompleteOrderStoreNames, ICompleteOrder } from "../../../interfaces";

const UpdateIdbDataButton = () => {
    const idb = useRef<IDB>(null);
    const initDB = async () => {
        idb.current = new IDB()
        await idb.current.initDB()
    }
    const onClick = async() => {
        /*
        dispatchNewEvent(CustomEventKeys.PRINTING_START)

        const newOrderNumber = [
            'EDH-250808-0011',
            'EDH-250808-0012'
        ]

        try {
            const orders = await idb.current.getItems(CompleteOrderStoreNames.Orders)
            const ordersToUpdate = orders.filter(e => !newOrderNumber.includes(e.id)) as ICompleteOrder[]
            await idb.current.updateItems(ordersToUpdate.map(e => ({...e,uploaded:true})),CompleteOrderStoreNames.Orders)
        } catch (e) {}

        dispatchNewEvent(CustomEventKeys.PRINTING_END)
        */
    }
    
    useEffect(()=>{
        initDB()
    },[])
    
    return (
        <Button color='error' variant='contained' sx={{fontWeight:'bold',letterSpacing:'0.05rem'}} onClick={onClick}>Update Orders</Button>
    )
}

export default UpdateIdbDataButton
import Button from "@mui/material/Button"
import { useEffect, useRef } from "react";
import { IDB } from "../../../hooks/class-db";
import { CompleteOrderStoreNames, ICompleteOrder } from "../../../interfaces";

const SetAllOrdersAsUploaded = () => {
    const idb = useRef<IDB>(null);
    const initDB = async () => {
        idb.current = new IDB()
        await idb.current.initDB()
    }

    const onClick = async() => {
        try {
            const allOrders = await idb.current.getItems(CompleteOrderStoreNames.Orders) as ICompleteOrder[]
            const newOrders = allOrders.map(e => ({...e,uploaded:true}))
            await idb.current.updateItems(newOrders,CompleteOrderStoreNames.Orders)
        } catch (e) {
            console.log(e)
        }
    }

    useEffect(()=>{
        initDB()
    },[])

    return (
        <Button color='error' variant='contained' sx={{fontWeight:'bold',letterSpacing:'0.05rem'}} onClick={onClick}>Set All Orders As Uploaded</Button>
    )
}

export default SetAllOrdersAsUploaded
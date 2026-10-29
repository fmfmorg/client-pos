import Button from "@mui/material/Button"
import { useEffect, useRef } from "react";
import { IDB } from "../../../hooks/class-db";
import { CompleteOrderStoreNames, ICompleteOrder, ICompleteOrderDiscountItem, ICompleteOrderItem, IRefundItem } from "../../../interfaces";

const SetAllOrdersAsUploaded = () => {
    const idb = useRef<IDB>(null);
    const initDB = async () => {
        idb.current = new IDB()
        await idb.current.initDB()
    }

    const onClick = async() => {
        try {
            const [allOrders,allOrderItems,allDiscountItems,allRefundItems] = await Promise.all([
                idb.current.getItems(CompleteOrderStoreNames.Orders) as Promise<ICompleteOrder[]>,
                idb.current.getItems(CompleteOrderStoreNames.OrderItems) as Promise<ICompleteOrderItem[]>,
                idb.current.getItems(CompleteOrderStoreNames.OrderDiscountItems) as Promise<ICompleteOrderDiscountItem[]>,
                idb.current.getItems(CompleteOrderStoreNames.RefundItems) as Promise<IRefundItem[]>,
            ])

            const newOrders = allOrders.map(e => ({...e,uploaded:true}))
            await idb.current.updateItems(newOrders,CompleteOrderStoreNames.Orders)

            const newOrderItems = allOrderItems.map(e => ({...e,uploaded:true}))
            await idb.current.updateItems(newOrderItems,CompleteOrderStoreNames.OrderItems)

            const newDiscountItems = allDiscountItems.map(e => ({...e,uploaded:true}))
            await idb.current.updateItems(newDiscountItems,CompleteOrderStoreNames.OrderDiscountItems)

            const newRefunds = allRefundItems.map(e => ({...e,uploaded:true}))
            await idb.current.updateItems(newRefunds,CompleteOrderStoreNames.RefundItems)
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
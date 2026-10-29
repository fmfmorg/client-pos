import { CustomEventKeys, dispatchNewEvent } from "@misc";
import Button from "@mui/material/Button"
import { useEffect, useRef } from "react";
import { IDB } from "../../../hooks/class-db";
import { CompleteOrderStoreNames, ICompleteOrder, ICompleteOrderDiscountItem, ICompleteOrderItem, IRefundItem } from "../../../interfaces";

const DownloadOrderButton = () => {
    const idb = useRef<IDB>(null);
    const initDB = async () => {
        idb.current = new IDB()
        await idb.current.initDB()
    }

    const onClick = async() => {
        dispatchNewEvent(CustomEventKeys.PRINTING_START)
        try {
            const resp = await fetch('/api/pos/fetch-all-orders')
            if (!resp.ok){
                const text = await resp.text()
                console.log(text)
                dispatchNewEvent(CustomEventKeys.PRINTING_END)
                return 
            }
            const {orders, orderItems, orderDiscountItems,refunds} = await resp.json() as {
                orders: ICompleteOrder[];
                orderItems: ICompleteOrderItem[];
                orderDiscountItems: ICompleteOrderDiscountItem[];
                refunds:IRefundItem[];
            }

            await Promise.all([
                CompleteOrderStoreNames.Orders,
                CompleteOrderStoreNames.OrderItems,
                CompleteOrderStoreNames.OrderDiscountItems,
                CompleteOrderStoreNames.RefundItems
            ].map(e => idb.current.clearStore(e)))

            // console.log(orders)
            // console.log(orderItems)
            // console.log(orderDiscountItems)
            // console.log(refunds)
            await idb.current.createItems(orders,CompleteOrderStoreNames.Orders)
            await idb.current.createItems(orderItems,CompleteOrderStoreNames.OrderItems)
            await idb.current.createItems(orderDiscountItems,CompleteOrderStoreNames.OrderDiscountItems)
            await idb.current.createItems(refunds,CompleteOrderStoreNames.RefundItems)
        } catch (e) {
            console.log(e)
        }
        dispatchNewEvent(CustomEventKeys.PRINTING_END)
    }

    useEffect(()=>{
        initDB()
    },[])

    return (
        <Button color='error' variant='contained' sx={{fontWeight:'bold',letterSpacing:'0.05rem'}} onClick={onClick}>Download Orders</Button>
    )
}

export default DownloadOrderButton
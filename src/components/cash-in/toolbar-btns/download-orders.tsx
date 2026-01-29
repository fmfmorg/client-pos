import { CustomEventKeys, dispatchNewEvent } from "@misc";
import Button from "@mui/material/Button"
import { useEffect, useRef } from "react";
import { IDB } from "src/hooks/class-db";
import { CompleteOrderStoreNames, ICompleteOrder, ICompleteOrderDiscountItem, ICompleteOrderItem } from "src/interfaces";

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
            }
            const {orders, orderItems, orderDiscountItems} = await resp.json() as {
                orders: ICompleteOrder[];
                orderItems: ICompleteOrderItem[];
                orderDiscountItems: ICompleteOrderDiscountItem[];
            }
            await idb.current.createItems(orders,CompleteOrderStoreNames.Orders)
            await idb.current.createItems(orderItems,CompleteOrderStoreNames.OrderItems)
            await idb.current.createItems(orderDiscountItems,CompleteOrderStoreNames.OrderDiscountItems)
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
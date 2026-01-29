import { broadcastChannelName, CustomEventKeys } from "@misc"
import TableCell from "@mui/material/TableCell"
import { useEffect, useRef, useState } from "react"
import { IDB } from "src/hooks/class-db"
import { CompleteOrderStoreNames, ICompleteOrder, ICompleteOrderDiscountItem, ICompleteOrderItem, IRefundItem } from "src/interfaces"

const IncomeCell = (
    {
        dateUnix,
        firstRow,
        paymentMethod,
    }:{
        dateUnix:number;
        firstRow:boolean;
        paymentMethod?:number;
    }
) => {
    const broadcastChannel = useRef<BroadcastChannel>(null)
    const idb = useRef<IDB>(null)
    const loading = useRef(true)
    const [amount,setAmount] = useState(0)
    const initDB = async() => {
        idb.current = new IDB()
        await idb.current.initDB()
        loading.current = false
        await updateAmount()
    }
    const updateAmount = async() => {
        if (loading.current) return
        loading.current = true

        const dayStart = new Date(dateUnix)
        dayStart.setHours(0,0,0,0)

        const dayEnd = new Date(dateUnix)
        dayEnd.setHours(23,59,59,999)

        try {
            const [allOrders, allOrderItems,allOrderDiscounts,allRefunds] = await Promise.all([
                idb.current.getItems(CompleteOrderStoreNames.Orders) as Promise<ICompleteOrder[]>,
                idb.current.getItems(CompleteOrderStoreNames.OrderItems) as Promise<ICompleteOrderItem[]>,
                idb.current.getItems(CompleteOrderStoreNames.OrderDiscountItems) as Promise<ICompleteOrderDiscountItem[]>,
                idb.current.getItems(CompleteOrderStoreNames.RefundItems) as Promise<IRefundItem[]>,
            ])

            let orders = allOrders.filter(e => e.dt > dayStart.valueOf() && e.dt < dayEnd.valueOf())
            if (!!paymentMethod) orders = [...orders.filter(e => e.paymentMethod === paymentMethod)]
            const orderNumbers = orders.map(e => e.id)

            const orderItems = allOrderItems.filter(e => orderNumbers.includes(e.orderID))
            const orderDiscounts = allOrderDiscounts.filter(e => orderNumbers.includes(e.orderID))
            const refunds = allRefunds.filter(e => orderNumbers.includes(e.orderID))

            const _amount = orderItems.map(e => (e.price - e.discount) * e.quantity).reduce((a,b)=>a+b,0) - orderDiscounts.map(e => e.amount).reduce((a,b)=>a+b,0) - refunds.map(e => e.amount).reduce((a,b)=>a+b,0)
            setAmount(_amount)
        } catch (e) {}

        loading.current = false
    }
    const onBroadcastMessage = (e:MessageEvent<any>) => {
        switch (e.data) {
            case CustomEventKeys.ORDER_COMPLETE:
                if (firstRow) updateAmount()
                break
            default: break;
        }
    }

    useEffect(()=>{
        initDB()
        return () => {
            broadcastChannel.current.close()
            
        }
    },[])

    useEffect(()=>{
        if (!broadcastChannel.current) broadcastChannel.current = new BroadcastChannel(broadcastChannelName)
        updateAmount()
        broadcastChannel.current.addEventListener('message',onBroadcastMessage)
        return () => {
            broadcastChannel.current.removeEventListener('message',onBroadcastMessage)
        }
    },[dateUnix,firstRow])

    return (
        <TableCell sx={{textAlign:'right'}}>{(amount * 0.01).toFixed(2)}</TableCell>
    )
}

export default IncomeCell
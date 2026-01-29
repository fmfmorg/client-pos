import { broadcastChannelName, CustomEventKeys } from "@misc"
import Stack from "@mui/material/Stack"
import TableCell from "@mui/material/TableCell"
import Typography from "@mui/material/Typography"
import { useContext, useEffect, useRef, useState } from "react"
import { IDB } from "src/hooks/class-db"
import { CompleteOrderStoreNames, ICompleteOrder, ICompleteOrderDiscountItem, ICompleteOrderItem, IRefundItem } from "src/interfaces"
import { DateContext } from "src/misc/date-selector/date-contexts"

const HeaderCell = (
    {
        text,
        paymentMethod,
    }:{
        text:string;
        paymentMethod?:number;
    }
) => {
    const broadcastChannel = useRef<BroadcastChannel>(null)
    const idb = useRef<IDB>(null)
    const loading = useRef(true)
    const [amount,setAmount] = useState(0)
    const {start,end} = useContext(DateContext)
    const initDB = async() => {
        idb.current = new IDB()
        await idb.current.initDB()
        loading.current = false
        await updateAmount()
    }
    const updateAmount = async() => {
        if (loading.current) return
        loading.current = true

        try {
            const [allOrders, allOrderItems,allOrderDiscounts,allRefunds] = await Promise.all([
                idb.current.getItems(CompleteOrderStoreNames.Orders) as Promise<ICompleteOrder[]>,
                idb.current.getItems(CompleteOrderStoreNames.OrderItems) as Promise<ICompleteOrderItem[]>,
                idb.current.getItems(CompleteOrderStoreNames.OrderDiscountItems) as Promise<ICompleteOrderDiscountItem[]>,
                idb.current.getItems(CompleteOrderStoreNames.RefundItems) as Promise<IRefundItem[]>,
            ])

            let orders = allOrders.filter(e => e.dt > start && e.dt < end)
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
                updateAmount()
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
        updateAmount()
        if (!broadcastChannel.current) broadcastChannel.current = new BroadcastChannel(broadcastChannelName)
        broadcastChannel.current.addEventListener('message',onBroadcastMessage)
        return () => {
            broadcastChannel.current.removeEventListener('message',onBroadcastMessage)
        }
    },[start,end])

    return (
        <TableCell>
            <Stack direction='row' justifyContent='space-between'>
                <Typography>{text}:</Typography>
                <Typography>{(amount * 0.01).toFixed(2)}</Typography>
            </Stack>
        </TableCell>
    )
}

export default HeaderCell
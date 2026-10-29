import TableCell from "@mui/material/TableCell"
import TableRow from "@mui/material/TableRow"
import { useEffect, useMemo, useRef, useState } from "react"
import { IIncomeRow } from "./interface"
import { IDB } from "../../hooks/class-db"
import { broadcastChannelName, CustomEventKeys } from "@misc"
import { CompleteOrderStoreNames, ICompleteOrder, ICompleteOrderDiscountItem, ICompleteOrderItem, IRefundItem } from "../../interfaces"

const IncomeRow = (e:IIncomeRow) => {
    const broadcastChannel = useRef<BroadcastChannel>(null)
    const idb = useRef<IDB>(null)
    const [card,setCard] = useState(e.card)
    const [cash,setCash] = useState(e.cash)
    const [orders,setOrders] = useState(e.orders)
    const initDB = async() => {
        idb.current = new IDB()
        await idb.current.initDB()
    }
    const dateStr = useMemo(()=>{
        const dt = new Date(e.date)
        return dt.toLocaleDateString('en-US',{month:'2-digit',day:'2-digit'})
    },[])
    const day = useMemo(()=>{
        const dt = new Date(e.date)
        return dt.toLocaleDateString('en-GB',{weekday:'short'})
    },[e.date])
    const isToday = useMemo(()=>{
        const _date = new Date(e.date)
        const now = new Date()
        return _date.getFullYear() === now.getFullYear() && _date.getMonth() === now.getMonth() && _date.getDate() === now.getDate()
    },[e.date])

    const updateAmount = async() => {
        const _today = new Date(e.date)
        _today.setHours(1,0,0,0)
        const _dayStart = _today.valueOf()
        const _dayEnd = _dayStart + 86400000

        const [allOrders, allOrderItems,allOrderDiscounts,allRefunds] = await Promise.all([
            idb.current.getItems(CompleteOrderStoreNames.Orders) as Promise<ICompleteOrder[]>,
            idb.current.getItems(CompleteOrderStoreNames.OrderItems) as Promise<ICompleteOrderItem[]>,
            idb.current.getItems(CompleteOrderStoreNames.OrderDiscountItems) as Promise<ICompleteOrderDiscountItem[]>,
            idb.current.getItems(CompleteOrderStoreNames.RefundItems) as Promise<IRefundItem[]>,
        ])

        const ordersOfToday = allOrders.filter(e => e.dt > _dayStart && e.dt < _dayEnd)
        setOrders(ordersOfToday.length)

        const paymentMethods = [1,2]

        for (const paymentMethod of paymentMethods){
            const _orders = [...ordersOfToday.filter(e => e.paymentMethod === paymentMethod)]
            const orderNumbers = _orders.map(e => e.id)
            const orderItems = allOrderItems.filter(e => orderNumbers.includes(e.orderID) && e.rl)
            const orderDiscounts = allOrderDiscounts.filter(e => orderNumbers.includes(e.orderID) && e.rl)
            const refunds = allRefunds.filter(e => orderNumbers.includes(e.orderID))
            const _amount = orderItems.map(e => (e.price - e.discount) * e.quantity).reduce((a,b)=>a+b,0) - orderDiscounts.map(e => e.amount).reduce((a,b)=>a+b,0) - refunds.map(e => e.amount).reduce((a,b)=>a+b,0)
            if (paymentMethod === 2) setCard(_amount)
            else setCash(_amount)
        }
    }

    const onBroadcastMessage = (e:MessageEvent<any>) => {
        switch (e.data) {
            case CustomEventKeys.ORDER_COMPLETE:
                if (isToday) updateAmount()
                break
            default: break;
        }
    }

    useEffect(()=>{
        broadcastChannel.current = new BroadcastChannel(broadcastChannelName)
        initDB()
        return () => {
            broadcastChannel.current.close()
        }
    },[])

    useEffect(()=>{
        broadcastChannel.current.addEventListener('message',onBroadcastMessage)
        return () => {
            broadcastChannel.current.removeEventListener('message',onBroadcastMessage)
        }
    },[isToday])

    useEffect(()=>setCard(e.card),[e.card])
    useEffect(()=>setCash(e.cash),[e.cash])
    useEffect(()=>setOrders(e.orders),[e.orders])

    return (
        <TableRow 
            sx={{
                backgroundColor:day[0] === 'S' ? 'rgba(255,255,0,0.3)' : 'transparent',
                ':hover':{
                    backgroundColor:day[0] === 'S' ? 'rgba(255,255,0,0.7)' : 'rgba(0,0,0,0.07)',
                }
            }}
        >
            <TableCell>{dateStr}</TableCell>
            <TableCell>{day}</TableCell>
            <TableCell sx={{textAlign:'right'}}>{orders}</TableCell>
            <TableCell sx={{textAlign:'right'}}>{(card * 0.01).toFixed(2)}</TableCell>
            <TableCell sx={{textAlign:'right'}}>{(cash * 0.01).toFixed(2)}</TableCell>
            <TableCell sx={{textAlign:'right'}}>{((cash + card) * 0.01).toFixed(2)}</TableCell>
        </TableRow>
    )
}

export default IncomeRow
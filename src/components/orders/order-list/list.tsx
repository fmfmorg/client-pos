import List from "@mui/material/List"
import { useContext, useEffect, useRef, useState } from "react"
import { IDB } from "../../../hooks/class-db"
import { CompleteOrderStoreNames, ICompleteOrder, ICompleteOrderDiscountItem, ICompleteOrderItem, IRefundItem } from "../../../interfaces"
import { DateContext, OrderNumberContext } from "../contexts"
import ListItem from "@mui/material/ListItem"
import ListItemButton from "@mui/material/ListItemButton"
import { broadcastChannelName, CustomEventKeys } from "@misc"
import { useTheme } from "@mui/material"
import Typography from '@mui/material/Typography'

interface IOrderItem {
    id:string;
    paymentMethod:number;
    amount:number;
}

const OrderBtn = ({item}:{item:IOrderItem}) => {
    const {palette:{grey}} = useTheme()
    const {updateOrderNumber,orderNumber} = useContext(OrderNumberContext)
    const onClick = () => updateOrderNumber(item.id)

    return (
        <ListItem sx={{backgroundColor: orderNumber === item.id ? grey[200] : 'transparent',py:0}}>
            <ListItemButton onClick={onClick} sx={{display:'flex',justifyContent:'space-between',py:2.5}}>
                <Typography>{item.id}</Typography>
                <Typography fontSize={14} textAlign='right' sx={{backgroundColor:item.paymentMethod === 1 ? 'yellow' : 'transparent'}}>£ {(item.amount * 0.01).toFixed(2)}</Typography>
            </ListItemButton>
        </ListItem>
    )
}

const ListBody = () => {
    const idb = useRef<IDB>(null)
    const loading = useRef(true)
    const broadcastChannel = useRef<BroadcastChannel>(null)
    const {date} = useContext(DateContext)
    const [orderItems,setOrderItems] = useState<IOrderItem[]>([])
    const initDB = async() => {
        idb.current = new IDB()
        await idb.current.initDB()
        loading.current = false
        await updateList()
    }
    const updateList = async() => {
        if (loading.current) return
        loading.current = true

        const [
            allOrders,
            allOrderItems,
            allOrderDiscounts,
            allRefunds,
        ] = await Promise.all([
            idb.current.getItems(CompleteOrderStoreNames.Orders) as Promise<ICompleteOrder[]>,
            idb.current.getItems(CompleteOrderStoreNames.OrderItems) as Promise<ICompleteOrderItem[]>,
            idb.current.getItems(CompleteOrderStoreNames.OrderDiscountItems) as Promise<ICompleteOrderDiscountItem[]>,
            idb.current.getItems(CompleteOrderStoreNames.RefundItems) as Promise<IRefundItem[]>,
        ])

        const end = date + 86400000

        const _orderNumbers = allOrders.filter(({dt})=>dt > date && dt < end).map(e => e.id).sort()
        let _orderItems:IOrderItem[] = []

        for (const id of _orderNumbers) {
            const order = allOrders.find(e => e.id === id)
            const paymentMethod = order.paymentMethod
            const stt = allOrderItems.filter(e => e.orderID === id).map(e => e.price * e.quantity).reduce((a,b) => a+b,0)
            const discount = allOrderDiscounts.filter(e => e.orderID === id).map(e => e.amount).reduce((a,b) => a+b,0)
            const refunds = allRefunds.filter(e => e.orderID === id).map(e => e.amount * e.quantity).reduce((a,b) => a+b,0)

            _orderItems.push({
                id,
                paymentMethod,
                amount:stt - discount - refunds,
            })
        }

        setOrderItems([..._orderItems])

        loading.current = false
    }
    const onBroadcastMessage = (e:MessageEvent<any>) => {
        switch (e.data) {
            case CustomEventKeys.ORDER_COMPLETE:
                updateList()
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
        updateList()
        broadcastChannel.current.addEventListener('message',onBroadcastMessage)
        return () => {
            broadcastChannel.current.removeEventListener('message',onBroadcastMessage)
        }
    },[date])

    return (
        <List>
            {orderItems.map(e => <OrderBtn key={e.id} item={e} />)}
        </List>
    )
}

export default ListBody
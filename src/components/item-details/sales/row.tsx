import TableRow from "@mui/material/TableRow"
import TableCell from "@mui/material/TableCell"
import { useEffect, useRef, useState } from "react"
import { IDB } from "../../../hooks/class-db"
import { CompleteOrderStoreNames, ICompleteOrder, ICompleteOrderDiscountItem, ICompleteOrderItem, IRefundItem } from "../../../interfaces"

const SalesRow = ({id}:{id:number}) => {
    const [dt,setDT] = useState(0)
    const [orderID,setOrderID] = useState('')
    const [quantity,setQuantity] = useState(0)
    const [price,setPrice] = useState(0)
    const [orderTotal,setOrderTotal] = useState(0)
    const idb = useRef<IDB>(null)
    const loading = useRef(true)
    const initDB = async() => {
        idb.current = new IDB()
        await idb.current.initDB()
        loading.current = false
        await fetchRecord()
    }
    const fetchRecord = async() => {
        if (loading.current) return
        loading.current = true

        try {
            const [item,allOrderItems,allDiscountItems,allRefundItems] = await Promise.all([
                idb.current.getItem(id,CompleteOrderStoreNames.OrderItems) as Promise<ICompleteOrderItem>,
                idb.current.getItems(CompleteOrderStoreNames.OrderItems) as Promise<ICompleteOrderItem[]>,
                idb.current.getItems(CompleteOrderStoreNames.OrderDiscountItems) as Promise<ICompleteOrderDiscountItem[]>,
                idb.current.getItems(CompleteOrderStoreNames.RefundItems) as Promise<IRefundItem[]>,
            ])
            const order = await idb.current.getItem(item.orderID,CompleteOrderStoreNames.Orders) as ICompleteOrder
            const refundItems = allRefundItems.filter(e => e.orderID === item.orderID && e.productID === item.productID)

            let refundQty = 0
            if (!!refundItems.length) refundQty = refundItems.map(e => e.quantity).reduce((a,b)=>a+b,0)

            setDT(order.dt)
            setOrderID(item.orderID)
            setQuantity(item.quantity - refundQty)
            setPrice(item.price - item.discount)

            const orderItems = allOrderItems.filter(e => e.orderID === item.orderID)
            const discounts = allDiscountItems.filter(e => e.orderID === item.orderID)

            setOrderTotal(orderItems.map(e => e.quantity * (e.price - e.discount)).reduce((a,b)=>a+b,0) - (!!discounts.length ? discounts.map(e => e.amount).reduce((a,b)=>a+b,0) : 0))
        } catch (e) {}

        loading.current = false
    }

    useEffect(()=>{
        initDB()
    },[])

    useEffect(()=>{
        fetchRecord()
    },[id])

    if (!quantity) return <></>

    return (
        <TableRow>
            <TableCell>{new Date(dt).toLocaleDateString('en-GB')}</TableCell>
            <TableCell>{orderID}</TableCell>
            <TableCell align='right'>{quantity}</TableCell>
            <TableCell align='right'>{(price * 0.01).toFixed(2)}</TableCell>
            <TableCell align='right'>{(orderTotal * 0.01).toFixed(2)}</TableCell>
        </TableRow>
    )
}

export default SalesRow
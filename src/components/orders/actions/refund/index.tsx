import { OrderNumberContext } from "@components/orders/contexts"
import Stack from "@mui/material/Stack"
import { useContext, useEffect, useRef, useState } from "react"
import { IDB } from "../../../../hooks/class-db"
import { CompleteOrderStoreNames, ICompleteOrderItem, IRefundItem } from "../../../../interfaces"
import RefundItem from "./item"
import NewRefund from "./new-refund"
import { CustomEventKeys } from "@misc"

const Refund = () => {
    const {orderNumber} = useContext(OrderNumberContext)
    const [refundIDs,setRefundIDs] = useState<number[]>([])
    const [refundable,setRefundable] = useState(false)
    const idb = useRef<IDB>(null)
    const loading = useRef(true)
    const initDB = async() => {
        idb.current = new IDB()
        await idb.current.initDB()
        loading.current = false
        await fetchRecords()
    }
    const fetchRecords = async() => {
        if (loading.current) return
        loading.current = true

        try {
            const [allRecords,allOrderItems] = await Promise.all([
                idb.current.getItems(CompleteOrderStoreNames.RefundItems) as Promise<IRefundItem[]>,
                idb.current.getItems(CompleteOrderStoreNames.OrderItems) as Promise<ICompleteOrderItem[]>,
            ])
            const refunds = allRecords.filter(e => e.orderID === orderNumber)
            const orderItems = allOrderItems.filter(e => e.orderID === orderNumber)

            if (!refunds.length) setRefundable(true);
            else {
                const orderQty = orderItems.map(e => e.quantity).reduce((a,b)=>a+b,0)
                const refundQty = refunds.map(e => e.quantity).reduce((a,b)=>a+b,0)
                setRefundable(orderQty > refundQty)
            }

            setRefundIDs([...refunds.map(e => e.id)])
        } catch (e) {}

        loading.current = false
    }

    useEffect(()=>{
        initDB()
    },[])

    useEffect(()=>{
        fetchRecords()
        document.addEventListener(CustomEventKeys.REFUND_SUBMITED,fetchRecords)
        
        return () => {
            document.removeEventListener(CustomEventKeys.REFUND_SUBMITED,fetchRecords)
        }
    },[orderNumber])

    return (
        <Stack direction='column' spacing={2} sx={{backgroundColor:'rgba(0,0,255,0.1)', p:1}}>
            {refundIDs.map(id => <RefundItem key={id} {...{id}} />)}
            {refundable && <NewRefund />}
        </Stack>
    )
}

export default Refund
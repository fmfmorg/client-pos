import Table from "@mui/material/Table"
import TableBody from "@mui/material/TableBody"
import TableContainer from "@mui/material/TableContainer"
import TableHead from "@mui/material/TableHead"
import TableRow from "@mui/material/TableRow"
import TableCell from "@mui/material/TableCell"
import Grid from '@mui/material/Grid2'
import { useContext, useEffect, useRef, useState } from "react"
import { IDB } from "../../../hooks/class-db"
import { ProductIdContext } from "../contexts"
import { CompleteOrderStoreNames, ICompleteOrder, ICompleteOrderDiscountItem, ICompleteOrderItem, IRefundItem } from "../../../interfaces"
import SalesRow from "./row"
import { IItemSalesRecord } from "./interface"

const SalesTable = () => {
    const {productID} = useContext(ProductIdContext)
    // const [idbID,setIdbIDs] = useState<number[]>([])
    const [salesRecords,setSalesRecords] = useState<IItemSalesRecord[]>([])
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
            // const allOrderItems = await idb.current.getItems(CompleteOrderStoreNames.OrderItems) as ICompleteOrderItem[]
            // const orderItems = allOrderItems.filter(e => e.productID === productID)
            // if (!!orderItems.length) {
            //     const ids = orderItems.sort((a,b)=>b.orderID > a.orderID ? 1 : -1).map(e => e.id)
            //     setIdbIDs([...ids])
            // } else setIdbIDs([])
            const [allOrderItems,allOrders,allDiscountItems,allRefundItems] = await Promise.all([
                idb.current.getItems(CompleteOrderStoreNames.OrderItems) as Promise<ICompleteOrderItem[]>,
                idb.current.getItems(CompleteOrderStoreNames.Orders) as Promise<ICompleteOrder[]>,
                idb.current.getItems(CompleteOrderStoreNames.OrderDiscountItems) as Promise<ICompleteOrderDiscountItem[]>,
                idb.current.getItems(CompleteOrderStoreNames.RefundItems) as Promise<IRefundItem[]>,
            ])
            const orderItems = allOrderItems.filter(e => e.productID === productID && !!e.rl)

            let records:IItemSalesRecord[] = []

            for (const orderItem of orderItems) {
                const {quantity,orderID,price} = orderItem

                const refundItems = allRefundItems.filter(e => e.orderID === orderID && e.productID === productID)
                let refundQty = 0
                if (!!refundItems.length) refundQty = refundItems.map(e => e.quantity).reduce((a,b)=>a+b,0);

                if (refundQty === quantity) continue;

                const order = allOrders.find(e => e.id === orderID)
                if (!order) continue;

                const {dt} = order

                const discounts = allDiscountItems.filter(e => e.orderID === orderID && !!e.rl)
                const thisOrderItems = allOrderItems.filter(e => e.orderID === orderID && !!e.rl)

                records.push({
                    dt,
                    orderID,
                    quantity: quantity - refundQty,
                    price,
                    orderTotal: thisOrderItems.map(e => e.quantity * (e.price - e.discount)).reduce((a,b)=>a+b,0) - (!!discounts.length ? discounts.map(e => e.amount).reduce((a,b)=>a+b,0) : 0)
                })
            }

            setSalesRecords([...records.sort((a,b)=>b.dt > a.dt ? 1 : -1)])
        } catch(e) {}

        loading.current = false
    }

    useEffect(()=>{
        initDB()
    },[])

    useEffect(()=>{
        fetchRecords()
    },[productID])

    return (
        <Grid size={5} sx={{height:'calc(100vh - 16px)',overflowY:'auto'}}>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Date</TableCell>
                            <TableCell>Order</TableCell>
                            <TableCell align='right'>Quantity</TableCell>
                            <TableCell align='right'>Price</TableCell>
                            <TableCell align='right'>Order Total</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {salesRecords.map(e => <SalesRow key={e.orderID} {...e} />)}
                        {/* {idbID.map(id => <SalesRow key={id} {...{id}} />)} */}
                    </TableBody>
                </Table>
            </TableContainer>
        </Grid>
    )
}

export default SalesTable
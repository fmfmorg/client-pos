import { useTheme } from "@mui/material"
import Table from "@mui/material/Table"
import TableBody from "@mui/material/TableBody"
import TableCell from "@mui/material/TableCell"
import TableContainer from "@mui/material/TableContainer"
import TableHead from "@mui/material/TableHead"
import TableRow from "@mui/material/TableRow"
import Typography from "@mui/material/Typography"
import { useEffect, useRef, useState } from "react"
import HeaderCell from "./header-cell"
import IncomeRow from "./income-row"
import { broadcastChannelName, CustomEventKeys, dispatchNewEvent } from "@misc"
import { CompleteOrderStoreNames, ICompleteOrder, ICompleteOrderDiscountItem, ICompleteOrderItem, IListDetails, IRefundItem } from "../../interfaces"
import { IDB } from "../../hooks/class-db"
import { IIncomeRow } from "./interface"

const IncomeTable = () => {
    const headers = useRef(['Date','Day'])
    const {palette} = useTheme()
    const idb = useRef<IDB>(null)
    const broadcastChannel = useRef<BroadcastChannel>(null)
    const initDB = async() => {
        idb.current = new IDB()
        await idb.current.initDB()

        const _start = new Date()
        _start.setHours(1,0,0,0)
        const start = _start.valueOf()
        const _end = new Date()
        _end.setHours(22,59,59,999)
        let end = _end.valueOf()

        dispatchNewEvent(CustomEventKeys.REFRESH_LIST,{start,end})
    }
    const [rows,setRows] = useState<IIncomeRow[]>([])
    const [cardTotal,setCardTotal] = useState(0)
    const [cashTotal,setCashTotal] = useState(0)
    const [orderCount,setOrderCount] = useState(0)
    const [periodStart,setPeriodStart] = useState(0)
    const [periodEnd,setPeriodEnd] = useState(0)

    const updateAmount = async() => {
        console.log(periodStart,periodEnd)
        const [allOrders, allOrderItems,allOrderDiscounts,allRefunds] = await Promise.all([
            idb.current.getItems(CompleteOrderStoreNames.Orders) as Promise<ICompleteOrder[]>,
            idb.current.getItems(CompleteOrderStoreNames.OrderItems) as Promise<ICompleteOrderItem[]>,
            idb.current.getItems(CompleteOrderStoreNames.OrderDiscountItems) as Promise<ICompleteOrderDiscountItem[]>,
            idb.current.getItems(CompleteOrderStoreNames.RefundItems) as Promise<IRefundItem[]>,
        ])

        const orders = allOrders.filter(e => e.dt > periodStart && e.dt < periodEnd)
        setOrderCount(orders.length)
        const paymentMethods = [1,2]

        for (const paymentMethod of paymentMethods){
            const _orders = [...orders.filter(e => e.paymentMethod === paymentMethod)]
            const orderNumbers = _orders.map(e => e.id)
            const orderItems = allOrderItems.filter(e => orderNumbers.includes(e.orderID) && e.rl)
            const orderDiscounts = allOrderDiscounts.filter(e => orderNumbers.includes(e.orderID) && e.rl)
            const refunds = allRefunds.filter(e => orderNumbers.includes(e.orderID))
            const _amount = orderItems.map(e => (e.price - e.discount) * e.quantity).reduce((a,b)=>a+b,0) - orderDiscounts.map(e => e.amount).reduce((a,b)=>a+b,0) - refunds.map(e => e.amount).reduce((a,b)=>a+b,0)
            if (paymentMethod === 2) setCardTotal(_amount)
            else setCashTotal(_amount);
        }
    }

    const onBroadcastMessage = (e:MessageEvent<any>) => {
        switch (e.data) {
            case CustomEventKeys.ORDER_COMPLETE:
                updateAmount()
                break
            default: break;
        }
    }

    const onDateUpdate = async (e:CustomEvent<IListDetails>) => {
        const {start,end} = e.detail

        let arr:number[] = []
        let _end = end

        while (_end > start) {
            arr.push(_end)
            _end -= 86400000
        }

        const [allOrders, allOrderItems,allOrderDiscounts,allRefunds] = await Promise.all([
            idb.current.getItems(CompleteOrderStoreNames.Orders) as Promise<ICompleteOrder[]>,
            idb.current.getItems(CompleteOrderStoreNames.OrderItems) as Promise<ICompleteOrderItem[]>,
            idb.current.getItems(CompleteOrderStoreNames.OrderDiscountItems) as Promise<ICompleteOrderDiscountItem[]>,
            idb.current.getItems(CompleteOrderStoreNames.RefundItems) as Promise<IRefundItem[]>,
        ])

        let result:IIncomeRow[] = []
        let _cardTotal = 0, _cashTotal = 0, _orderCount = 0;

        const paymentMethods = [1,2]

        for (const dt of arr) {
            const dayStart = new Date(dt)
            dayStart.setHours(0,0,0,0)

            const dayEnd = new Date(dt)
            dayEnd.setHours(23,59,59,999)

            let orders = allOrders.filter(e => e.dt > dayStart.valueOf() && e.dt < dayEnd.valueOf())
            let card = 0, cash = 0, orderCount = 0;

            for (const paymentMethod of paymentMethods){
                const _orders = [...orders.filter(e => e.paymentMethod === paymentMethod)]
                const orderNumbers = _orders.map(e => e.id)
                const orderItems = allOrderItems.filter(e => orderNumbers.includes(e.orderID) && e.rl)
                const orderDiscounts = allOrderDiscounts.filter(e => orderNumbers.includes(e.orderID) && e.rl)
                const refunds = allRefunds.filter(e => orderNumbers.includes(e.orderID))
                const _amount = orderItems.map(e => (e.price - e.discount) * e.quantity).reduce((a,b)=>a+b,0) - orderDiscounts.map(e => e.amount).reduce((a,b)=>a+b,0) - refunds.map(e => e.amount).reduce((a,b)=>a+b,0)
                orderCount += _orders.length;
                if (paymentMethod === 2) card = _amount;
                else cash = _amount;
            }

            _cardTotal += card
            _cashTotal += cash
            _orderCount += orders.length

            result.push({
                date:dt,
                orders:orderCount,
                card,
                cash,
            })
        }

        setCardTotal(_cardTotal)
        setCashTotal(_cashTotal)
        setOrderCount(_orderCount)

        setRows([...result])

        setPeriodStart(start)
        setPeriodEnd(end)

    }

    useEffect(()=>{
        initDB()
        document.title = 'Income'
        broadcastChannel.current = new BroadcastChannel(broadcastChannelName)
        
        return () => {
            broadcastChannel.current.close()
        }
    },[])
    
    useEffect(()=>{
        document.addEventListener(CustomEventKeys.REFRESH_LIST,onDateUpdate)
        broadcastChannel.current.addEventListener('message',onBroadcastMessage)

        return () => {
            document.removeEventListener(CustomEventKeys.REFRESH_LIST,onDateUpdate)
            broadcastChannel.current.removeEventListener('message',onBroadcastMessage)
        }
    },[periodStart,periodEnd])

    return (
        <TableContainer sx={{display:'flex',justifyContent:'center'}}>
            <Table 
                sx={{
                    maxWidth:'800px',
                    '* th, * td':{
                        borderWidth:'1px',
                        borderColor:palette.grey[300],
                        borderStyle:'solid'
                    },
                }}
            >
                <TableHead>
                    <TableRow>
                        {headers.current.map(e => <TableCell key={e}><Typography>{e}</Typography></TableCell>)}
                        <HeaderCell title="Orders" amount={`${orderCount}`} />
                        <HeaderCell title="Card" amount={(cardTotal * 0.01).toFixed(2)} />
                        <HeaderCell title="Cash" amount={(cashTotal * 0.01).toFixed(2)} />
                        <HeaderCell title="Total" amount={((cardTotal + cashTotal) * 0.01).toFixed(2)} />
                    </TableRow>
                </TableHead>
                <TableBody>
                    {/* {datesUnix.map((e,i) => <IncomeRow key={e} {...{dateUnix:e,firstRow:i === 0}} />)} */}
                    {rows.map(e => <IncomeRow key={e.date} {...e} />)}
                </TableBody>
            </Table>
        </TableContainer>
    )
}

export default IncomeTable
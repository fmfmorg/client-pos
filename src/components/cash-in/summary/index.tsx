import Box from '@mui/material/Box'
import Context from "@components/contexts"
import { CustomEventKeys, ElementID } from "@misc"
import { useContext, useEffect, useMemo, useRef, useState } from "react"
import DiscountRow from './discount-row'
import Stack from '@mui/system/Stack'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'
import ManualDiscountPercentageComponent from './manual-discount-percentage'
import ManualDiscountAmountComponent from './manual-discount-amount'
import CardBtn from './card'
import Cash from './cash'
import BackToEditOrderBtn from './back-to-edit-order'
import SubmitCashOrderBtn from './submit-cash-order-btn'
import ReprintReceipt from './reprint-receipt'
import NextOrderBtn from './next-order-btn'
import SubmitCardOrderBtn from './submit-card-order-btn'
import { IDB } from '../../../hooks/class-db'
import { OrderStatusEnum } from '../../../misc/order-status'
import { IOrder, IOrderDiscountItem, StoreNames } from '../../../interfaces'
import { ManualDiscountFixedAmount, ManualDiscountPercentage } from '../../../misc/discounts'

const Summary = () => {
    const { currentOrderID } = useContext(Context)
    const [orderStatus,setOrderStatus] = useState(OrderStatusEnum.EDITING)
    const [cashReceived,setCashReceived] = useState(0)
    const showCashAmount = useMemo(()=>!!cashReceived && orderStatus !== OrderStatusEnum.EDITING,[cashReceived,orderStatus])
    const updateCashReceived = (v:number) => setCashReceived(v)
    const idb = useRef<IDB>(null)
    const loading = useRef(true)
    const containerRef = useRef<HTMLDivElement>(null)
    const [itemCount,setItemCount] = useState(0)
    const [subtotal,setSubtotal] = useState(0)
    const [discountIDs,setDiscountIDs] = useState<number[]>([])
    const [discountTotal,setDiscountTotal] = useState(0)
    const resizeSidebar = () => {
        const header = document.getElementsByTagName('header')[0]
        const {height} = header.getBoundingClientRect()
        const {top} = document.body.getBoundingClientRect()
        containerRef.current.style.height = `calc(100vh - ${height + top * 2}px)`
    }
    const initDB = async () => {
        idb.current = new IDB()
        await idb.current.initDB()
        loading.current = false
        await updateDetails()
    }
    
    const updateDetails = async() => {
        if (loading.current || !currentOrderID) return

        loading.current = true

        const _itemCount = await idb.current.getOrderItemCount(currentOrderID)
        setItemCount(_itemCount)

        const stt = await idb.current.getOrderSubtotal(currentOrderID)
        setSubtotal(stt)

        try {
            const order = await idb.current.getItem(currentOrderID, StoreNames.Orders) as IOrder
            if (order.status < OrderStatusEnum.SUBMITTED) {
                await idb.current.updateOrderStatus(currentOrderID,OrderStatusEnum.EDITING)
                setOrderStatus(OrderStatusEnum.EDITING)
            } else {
                setOrderStatus(order.status)
            }
        } catch (e) {}

        try {
            const allDiscountItems = await idb.current.getItems(StoreNames.OrderDiscountItems) as IOrderDiscountItem[]
            if (!allDiscountItems.length){
                setDiscountIDs([])
                setDiscountTotal(0)
            } else {
                const thisOrderDiscounts = allDiscountItems.filter(e => e.orderID === currentOrderID && e.amount !== 0)
                if (!thisOrderDiscounts.length){
                    setDiscountIDs([])
                    setDiscountTotal(0)
                } else {
                    const filteredDiscountItems = thisOrderDiscounts.filter(e => ![ManualDiscountPercentage.ORDER_IN_RECEIPT,ManualDiscountFixedAmount.ORDER_IN_RECEIPT].includes(e.orderInReceipt))
                    if (!!filteredDiscountItems.length) setDiscountIDs([...filteredDiscountItems.sort((a,b)=>a.orderInReceipt - b.orderInReceipt).map(e => e.id)])
                    else setDiscountIDs([])
                    setDiscountTotal(thisOrderDiscounts.map(e => e.amount).reduce((a,b)=>a+b,0))
                }
            }
        } catch (e) {}

        loading.current = false
    }
    const updateCashForm = () => {
        const cashField = document.getElementById('cash-field') as HTMLInputElement
        if (!!cashField) cashField.value = ''
    }
    const updateOrderStatus = async() => {
        if (loading.current) return

        loading.current = true

        const order = await idb.current.getItem(currentOrderID, StoreNames.Orders) as IOrder
        setOrderStatus(order.status)

        loading.current = false
    }
    
    useEffect(()=>{
        initDB()
        resizeSidebar()
    },[])

    useEffect(()=>{
        updateDetails()
        setCashReceived(0)
        updateCashForm()
        document.addEventListener(CustomEventKeys.ORDER_ITEM_LIST_UPDATED,updateDetails)
        document.addEventListener(CustomEventKeys.ORDER_STATUS_UPDATED,updateOrderStatus)

        return () => {
            document.removeEventListener(CustomEventKeys.ORDER_ITEM_LIST_UPDATED,updateDetails)
            document.removeEventListener(CustomEventKeys.ORDER_STATUS_UPDATED,updateOrderStatus)
        }
    },[currentOrderID])

    return (
        <Box position='relative' ref={containerRef}>
            <Stack 
                direction='column'
                divider={<Divider orientation='horizontal' flexItem />}
                sx={{'* p, * button':{fontSize:'1.4rem'}}}
            >
                <Stack direction='row' sx={{justifyContent:'space-between',py:1}}>
                    <Stack direction='column' justifyContent='center'><Typography>Count</Typography></Stack>
                    <Typography align="right" sx={{fontSize:'2.5rem !important',fontWeight:'900'}}>{itemCount}</Typography>
                </Stack>
                <Stack direction='row' sx={{justifyContent:'space-between',py:1}}>
                    <Typography>Subtotal</Typography>
                    <Typography align="right">{(subtotal * 0.01).toFixed(2)}</Typography>
                </Stack>
                {!!discountIDs.length && discountIDs.map(id => <DiscountRow key={id} id={id} />)}
                {!!subtotal && <>
                <ManualDiscountPercentageComponent />
                <ManualDiscountAmountComponent />
                </>}
                <Stack direction='column'>
                    <Stack direction='row' sx={{justifyContent:'space-between'}}>
                        <Stack direction='column' justifyContent='center'><Typography>Total</Typography></Stack>
                        <Typography align='right' sx={{fontSize:'2.5rem !important',fontWeight:'900'}}>{((subtotal - discountTotal) * 0.01).toFixed(2)}</Typography>
                    </Stack>
                    {showCashAmount && <Stack direction='row' justifyContent='space-between'>
                        <Stack direction='column' justifyContent='center'><Typography>Received</Typography></Stack>
                        <Typography sx={{fontSize:'2.5rem !important',fontWeight:'900'}} id={ElementID.AMOUNT_RECEIVED}>{(cashReceived * 0.01).toFixed(2)}</Typography>
                    </Stack>}
                </Stack>
                {showCashAmount && Math.round(subtotal - discountTotal) !== Math.round(cashReceived) && <Stack direction='row' justifyContent='space-between' sx={{px:1,backgroundColor:'#cc0000','* p, p':{color:'#fff'}}}>
                    <Stack direction='column' justifyContent='center'><Typography>Change</Typography></Stack>
                    <Typography sx={{fontSize:'2.5rem !important',fontWeight:'700'}}>{((cashReceived - subtotal + discountTotal) * 0.01).toFixed(2)}</Typography>
                </Stack>}
            </Stack>
            <Stack 
                direction='column'
                rowGap={1}
                divider={<Divider orientation='horizontal' flexItem />}
                sx={{position:'absolute',bottom:0,left:0,width:'100%',display:(subtotal > discountTotal && !!subtotal) ? 'flex' : 'none'}}
            >
                {orderStatus === OrderStatusEnum.EDITING && <Cash {...{cashReceived,updateCashReceived,orderSubtotal:subtotal - discountTotal}} />}
                {orderStatus === OrderStatusEnum.EDITING && <CardBtn />}
                {orderStatus === OrderStatusEnum.READY_CARD && <SubmitCardOrderBtn />}
                {(orderStatus === OrderStatusEnum.READY_CASH || orderStatus === OrderStatusEnum.READY_CARD) && <BackToEditOrderBtn />}
                {orderStatus === OrderStatusEnum.READY_CASH && <SubmitCashOrderBtn />}
                {orderStatus === OrderStatusEnum.SUBMITTED && <ReprintReceipt />}
                {orderStatus === OrderStatusEnum.SUBMITTED && <NextOrderBtn />}
            </Stack>
        </Box>
    )
}

export default Summary
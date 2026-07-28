import Context from "@components/contexts"
import { cleanNumberString, CustomEventKeys } from "@misc"
import Button from "@mui/material/Button"
import InputAdornment from "@mui/material/InputAdornment"
import Stack from "@mui/material/Stack"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import { FormEvent, useContext, useEffect, useRef, useState } from "react"
import { IOrder, IOrderDiscountItem, StoreNames } from "../../../interfaces"
import { ManualDiscountFixedAmount } from "../../../misc/discounts"
import { OrderStatusEnum } from "../../../misc/order-status"
import { IDB } from "../../../hooks/class-db"

const EditField = ({toggle}:{toggle:()=>void;}) => {
    const {currentOrderID} = useContext(Context)
    const inputRef = useRef<HTMLInputElement>(null)
    const idb = useRef<IDB>(null)

    const initDB = async() => {
        idb.current = new IDB()
        await idb.current.initDB()
        
        try {
            const allDiscountItems = await idb.current.getItems(StoreNames.OrderDiscountItems) as IOrderDiscountItem[]
            const thisDiscountItem = allDiscountItems.find(e => e.orderID === currentOrderID && e.orderInReceipt === ManualDiscountFixedAmount.ORDER_IN_RECEIPT)
            if (!!thisDiscountItem) inputRef.current.value = cleanNumberString((thisDiscountItem.values[0] as number * 0.01).toFixed(2))
            else inputRef.current.value = ''
            inputRef.current.focus()
        } catch (e) {}
    }
    const onSubmit = async (e:FormEvent) => {
        e.preventDefault()

        const tempValue = +inputRef.current.value
        const value = isNaN(tempValue) ? 0 : tempValue * 100

        try {
            const allDiscountItems = await idb.current.getItems(StoreNames.OrderDiscountItems) as IOrderDiscountItem[]
            const thisDiscountItem = allDiscountItems.find(e => e.orderID === currentOrderID && e.orderInReceipt === ManualDiscountFixedAmount.ORDER_IN_RECEIPT)
            if (!!thisDiscountItem) {
                thisDiscountItem.values = [value]
                await idb.current.updateItem(thisDiscountItem, StoreNames.OrderDiscountItems)
            } else {
                await idb.current.createItem({
                    orderID:currentOrderID,
                    name:ManualDiscountFixedAmount.NAME_ON_RECEIPT.replace('X',!!value ? (value * 0.01).toFixed(2) : '0'),
                    amount:0,
                    orderInReceipt:ManualDiscountFixedAmount.ORDER_IN_RECEIPT as number,
                    values:[value]
                },StoreNames.OrderDiscountItems)
            }

            await idb.current.orderItemsOnEdit(currentOrderID)
        } catch (e) {}

        toggle()
    }

    useEffect(()=>{
        initDB()
    },[])

    return (
        <Stack direction='row' columnGap={1} component='form' sx={{width:'100%'}} id='manual-discount-fixed-amount-form' onSubmit={onSubmit}>
            <TextField 
                fullWidth
                inputRef={inputRef}
                size='small'
                slotProps={{
                    input:{
                        sx:{fontSize:'1.4rem',letterSpacing:'0.3rem'},
                        startAdornment:<InputAdornment position="start">£</InputAdornment>,
                        type:'number',
                    },
                    htmlInput:{
                        step:0.01,
                        min:0,
                        sx:{textAlign:'center'}
                    }
                }}
            />
            <Button type='submit' variant="contained" size='small'>OK</Button>
        </Stack>
    )
}

const Btn = ({toggle}:{toggle:()=>void;}) => {
    const {currentOrderID} = useContext(Context)
    const idb = useRef<IDB>(null)
    const loading = useRef(true)
    const [amount,setAmount] = useState(0)
    const [disabled,setDisabled] = useState(false)
    const initDB = async () => {
        idb.current = new IDB()
        await idb.current.initDB()
        loading.current = false
        await getData()
    }
    const getData = async () => {
        if (loading.current) return

        loading.current = true

        try {
            const allDiscountItems = await idb.current.getItems(StoreNames.OrderDiscountItems) as IOrderDiscountItem[]
            const thisDiscountItem = allDiscountItems.find(e => e.orderID === currentOrderID && e.orderInReceipt === ManualDiscountFixedAmount.ORDER_IN_RECEIPT)
            if (!!thisDiscountItem) setAmount(thisDiscountItem.values[0] as number)
        } catch (e) {}

        await getOrderStatus()

        loading.current = false
    }
    const getOrderStatus = async() => {
        try {
            const order = await idb.current.getItem(currentOrderID,StoreNames.Orders) as IOrder
            if (!!order) setDisabled(order.status !== OrderStatusEnum.EDITING)
        } catch (e) {}
    }

    useEffect(()=>{
        initDB()
    },[])

    useEffect(()=>{
        getData()
    },[currentOrderID])

    useEffect(()=>{
        document.addEventListener(CustomEventKeys.ORDER_STATUS_UPDATED,getOrderStatus)

        return () => {
            document.removeEventListener(CustomEventKeys.ORDER_STATUS_UPDATED,getOrderStatus)
        }
    },[currentOrderID,disabled])

    return (
        <Button 
            variant="contained" 
            fullWidth 
            size="small" 
            sx={{
                backgroundColor:'#777',
                '&.Mui-disabled':{color:'#000'}
            }} 
            onClick={toggle}
            disabled={disabled}
        >-£{!!amount ? (amount * 0.01).toFixed(2) : amount}</Button>
    )
}

const Amount = () => {
    const {currentOrderID} = useContext(Context)
    const [amount,setAmount] = useState(0)
    const idb = useRef<IDB>(null)
    const loading = useRef(true)
    const initDB = async () => {
        idb.current = new IDB()
        await idb.current.initDB()
        loading.current = false
        await getData()
    }
    const getData = async() => {
        if (loading.current) return

        loading.current = true

        try {
            const allDiscountItems = await idb.current.getItems(StoreNames.OrderDiscountItems) as IOrderDiscountItem[]
            const thisDiscountItem = allDiscountItems.find(e => e.orderID === currentOrderID && e.orderInReceipt === ManualDiscountFixedAmount.ORDER_IN_RECEIPT)
            if (!!thisDiscountItem) setAmount(thisDiscountItem.amount * 0.01)
        } catch (e) {}

        loading.current = false
    }

    useEffect(()=>{
        initDB()
    },[])

    useEffect(()=>{
        getData()
        document.addEventListener(CustomEventKeys.ORDER_ITEM_LIST_UPDATED,getData)

        return () => {
            document.removeEventListener(CustomEventKeys.ORDER_ITEM_LIST_UPDATED,getData)
        }
    },[currentOrderID])
    
    return (
        <Stack direction='column' justifyContent='center'>
            <Typography sx={{minWidth:'3rem'}} align="right">{!!amount ? '-'+amount.toFixed(2) : amount}</Typography>
        </Stack>
    )
}

const ManualDiscountAmountComponent = () => {
    const {currentOrderID} = useContext(Context)
    const idb = useRef<IDB>(null)
    const initDB = async() => {
        idb.current = new IDB()
        await idb.current.initDB()
    }
    const [editMode,setEditMode] = useState(false)
    const toggle = () => setEditMode(prev => !prev)
    const getOrderStatus = async() => {
        if (!editMode) return

        try {
            const order = await idb.current.getItem(currentOrderID,StoreNames.Orders) as IOrder
            if (!!order) setEditMode(order.status === OrderStatusEnum.EDITING)
        } catch (e) {}
    }

    useEffect(()=>{
        initDB()
    },[])

    useEffect(()=>{
        setEditMode(false)
    },[currentOrderID])

    useEffect(()=>{
        document.addEventListener(CustomEventKeys.ORDER_STATUS_UPDATED,getOrderStatus)

        return () => {
            document.removeEventListener(CustomEventKeys.ORDER_STATUS_UPDATED,getOrderStatus)
        }
    },[currentOrderID,editMode])
    
    return (
        <Stack direction='row' columnGap={2} sx={{py:1}}>
            {!editMode && <Btn toggle={toggle} />}
            {editMode && <EditField toggle={toggle} />}
            <Amount />
        </Stack>
    )
}

export default ManualDiscountAmountComponent
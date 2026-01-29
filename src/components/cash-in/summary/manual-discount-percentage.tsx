import Context from "@components/contexts"
import Button from "@mui/material/Button"
import Stack from "@mui/material/Stack"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import InputAdornment from '@mui/material/InputAdornment';
import { FormEvent, useContext, useEffect, useRef, useState } from "react"
import { IDB } from "src/hooks/class-db"
import { ManualDiscountPercentage } from "src/misc/discounts"
import { CustomEventKeys } from "@misc"
import { IOrder, IOrderDiscountItem, StoreNames } from "src/interfaces"
import { OrderStatusEnum } from "src/misc/order-status"

const EditField = ({toggle}:{toggle:()=>void;}) => {
    const {currentOrderID} = useContext(Context)
    const inputRef = useRef<HTMLInputElement>(null)
    const idb = useRef<IDB>(null)
    const initDB = async() => {
        idb.current = new IDB()
        await idb.current.initDB()
        
        try {
            const allDiscountItems = await idb.current.getItems(StoreNames.OrderDiscountItems) as IOrderDiscountItem[]
            const thisDiscountItem = allDiscountItems.find(e => e.orderID === currentOrderID && e.orderInReceipt === ManualDiscountPercentage.ORDER_IN_RECEIPT)
            if (!!thisDiscountItem) inputRef.current.value = (thisDiscountItem.values[0] as number).toString()
            inputRef.current.focus()
        } catch (e) {}
    }
    const onSubmit = async (e:FormEvent) => {
        e.preventDefault()

        const tempValue = +inputRef.current.value
        const value = isNaN(tempValue) ? 0 : tempValue

        try {
            const allDiscountItems = await idb.current.getItems(StoreNames.OrderDiscountItems) as IOrderDiscountItem[]
            const thisDiscountItem = allDiscountItems.find(e => e.orderID === currentOrderID && e.orderInReceipt === ManualDiscountPercentage.ORDER_IN_RECEIPT)
            if (!!thisDiscountItem) {
                thisDiscountItem.values = [value]
                await idb.current.updateItem(thisDiscountItem,StoreNames.OrderDiscountItems)
            } else {
                await idb.current.createItem({
                    orderID:currentOrderID,
                    name:ManualDiscountPercentage.NAME_ON_RECEIPT.replace('X',value.toString()),
                    amount:0,
                    orderInReceipt:ManualDiscountPercentage.ORDER_IN_RECEIPT as number,
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
        <Stack direction='row' columnGap={1} component='form' sx={{width:'100%'}} id='manual-discount-percentage-form' onSubmit={onSubmit}>
            <TextField 
                fullWidth
                inputRef={inputRef}
                size='small'
                slotProps={{
                    input:{
                        sx:{fontSize:'1.4rem',letterSpacing:'0.3rem'},
                        endAdornment:<InputAdornment position="end">%</InputAdornment>,
                        type:'number',
                    },
                    htmlInput:{
                        step:1,
                        min:0,
                        max:100,
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
    const [rate,setRate] = useState(0)
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
            const thisDiscountItem = allDiscountItems.find(e => e.orderID === currentOrderID && e.orderInReceipt === ManualDiscountPercentage.ORDER_IN_RECEIPT)
            if (!!thisDiscountItem) setRate(thisDiscountItem.values[0] as number)
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
        >-{rate}%</Button>
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
    const getData = async () => {
        if (loading.current) return

        loading.current = true

        try {
            const allDiscountItems = await idb.current.getItems(StoreNames.OrderDiscountItems) as IOrderDiscountItem[]
            const thisDiscountItem = allDiscountItems.find(e => e.orderID === currentOrderID && e.orderInReceipt === ManualDiscountPercentage.ORDER_IN_RECEIPT)
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

const ManualDiscountPercentageComponent = () => {
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
            {editMode && <EditField toggle={toggle} />}
            {!editMode && <Btn toggle={toggle} />}
            <Amount />
        </Stack>
    )
}

export default ManualDiscountPercentageComponent
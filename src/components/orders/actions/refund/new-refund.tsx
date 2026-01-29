import Button from "@mui/material/Button"
import Stack from "@mui/material/Stack"
import { FormEvent, useContext, useEffect, useId, useRef, useState } from "react"
import AddIcon from '@mui/icons-material/Add'
import { IDB } from "src/hooks/class-db"
import { OrderNumberContext } from "@components/orders/contexts"
import { CompleteOrderStoreNames, ICompleteOrderItem, IRefundItem } from "src/interfaces"
import Select, { SelectChangeEvent } from "@mui/material/Select"
import MenuItem from "@mui/material/MenuItem"
import FormControl from "@mui/material/FormControl"
import InputLabel from "@mui/material/InputLabel"
import { NumberField } from '@base-ui-components/react/number-field';
import styles from './index.module.css';
import MinusIcon from "src/misc/minus-icon"
import PlusIcon from "src/misc/plus-icon"
import TextField from "@mui/material/TextField"
import { CustomEventKeys, dispatchNewEvent } from "@misc"

const NewRefund = () => {
    const amountRef = useRef<HTMLInputElement>(null)
    const notesRef = useRef<HTMLInputElement>(null)
    const qtyRef = useRef<HTMLInputElement>(null)
    const {orderNumber} = useContext(OrderNumberContext)
    const idb = useRef<IDB>(null)
    const id = useId()
    const quantityFieldID = useId()
    const loading = useRef(true)
    const [productID,setProductID] = useState('')
    const [productIDs,setProductIDs] = useState<string[]>([])
    const [refundableQty,setRefundableQty] = useState(0)
    const [editMode,setEditMode] = useState(false)
    const toggleEditMode = () => setEditMode(prev => !prev)
    const [quantity,setQuantity] = useState(1)
    const initDB = async() => {
        idb.current = new IDB()
        await idb.current.initDB()
        loading.current = false
        await updateRecord()
    }
    const updateRecord = async() => {
        if (loading.current) return
        loading.current = true

        try {
            const [allRefunds,allOrderItems] = await Promise.all([
                idb.current.getItems(CompleteOrderStoreNames.RefundItems) as Promise<IRefundItem[]>,
                idb.current.getItems(CompleteOrderStoreNames.OrderItems) as Promise<ICompleteOrderItem[]>,
            ])
            const refunds = allRefunds.filter(e => e.orderID === orderNumber)
            const orderItems = allOrderItems.filter(e => e.orderID === orderNumber)
            const refundableItems = orderItems.filter(e => {
                const matchingRefundItems = refunds.filter(d => d.productID === e.productID)
                if (!matchingRefundItems.length) return true;

                const refundQty = matchingRefundItems.map(e => e.quantity).reduce((a,b)=>a+b,0)
                return e.quantity > refundQty
            })
            const _productIDs = refundableItems.map(e => e.productID)
            setProductIDs([..._productIDs])
            setProductID(_productIDs[0])
        } catch (e) {}

        loading.current = false
    }
    const productIdOnChange = (e:SelectChangeEvent<string>) => setProductID(e.target.value)
    const updateRefundableQuantity = async() => {
        setQuantity(1)
        try {
            const [allRefunds,allOrderItems] = await Promise.all([
                idb.current.getItems(CompleteOrderStoreNames.RefundItems) as Promise<IRefundItem[]>,
                idb.current.getItems(CompleteOrderStoreNames.OrderItems) as Promise<ICompleteOrderItem[]>,
            ])
            const orderItem = allOrderItems.find(e => e.orderID === orderNumber && e.productID === productID)
            if (!orderItem) setRefundableQty(0);
            else {
                const refunds = allRefunds.filter(e => e.orderID === orderNumber && e.productID === productID)
                if (!refunds.length) setRefundableQty(orderItem.quantity);
                else setRefundableQty(orderItem.quantity - refunds.map(e => e.quantity).reduce((a,b)=>a+b,0))
            }
        } catch (e) {}
    }
    const quantityOnChange = (value: number | null, _: Event | undefined) => {
        if (!!value) setQuantity(value)
    }
    const onCancel = () => setEditMode(false)
    const onSubmit = async(e:FormEvent) => {
        e.preventDefault()
        
        const refundItem:IRefundItem = {
            productID,
            orderID:orderNumber,
            quantity,
            amount:+amountRef.current.value * 100,
            dt:Date.now(),
            note:notesRef.current.value,
            uploaded:false,
            dbToBeUpdated:false,
        }

        await idb.current.createItem(refundItem,CompleteOrderStoreNames.RefundItems)
        dispatchNewEvent(CustomEventKeys.REFUND_SUBMITED)
        amountRef.current.value = ''
        notesRef.current.value = ''
        await updateRecord()
        await updateRefundableQuantity()
    }

    useEffect(()=>{
        initDB()
    },[])

    useEffect(()=>{
        updateRecord()
    },[orderNumber])

    useEffect(()=>{
        if (!!orderNumber && !!productID) updateRefundableQuantity();
    },[orderNumber,productID])
    
    if (!editMode) return (
        <Button onClick={toggleEditMode} variant="contained" startIcon={<AddIcon sx={{scale:1.4,mr:2}} />} sx={{fontSize:'1.4rem',letterSpacing:'0.3rem'}}>Add Refund</Button>
    )

    return (
        <Stack direction='column' spacing={2} component='form' id='new-refund-form' onSubmit={onSubmit}>
            <FormControl fullWidth>
                <InputLabel id={id}>Item</InputLabel>
                <Select 
                    value={productID}
                    labelId={id}
                    label='Item'
                    onChange={productIdOnChange}
                >
                    {productIDs.map(e => (
                        <MenuItem key={e} value={e} >{e}</MenuItem>
                    ))}
                </Select>
            </FormControl>
            <NumberField.Root id={quantityFieldID} value={quantity} className={styles.Field} min={1} max={refundableQty} onValueChange={quantityOnChange} style={{display:'flex',flexDirection:'row'}}>
                <label htmlFor={quantityFieldID} style={{fontFamily:'Roboto',marginRight:'1rem',display:'flex',flexDirection:'column',justifyContent:'center',height:'100%'}}>
                    <span>Quantity</span>
                </label>
                <NumberField.Group className={styles.Group}>
                    <NumberField.Decrement className={styles.Decrement}>
                        <MinusIcon />
                    </NumberField.Decrement>
                    <NumberField.Input className={styles.Input} ref={qtyRef} />
                    <NumberField.Increment className={styles.Increment}>
                        <PlusIcon />
                    </NumberField.Increment>
                </NumberField.Group>
            </NumberField.Root>
            <TextField 
                type='number'
                label='Amount (£)'
                inputRef={amountRef}
                slotProps={{
                    htmlInput:{
                        step:0.01,
                        min:0.01,
                    },
                }}
                required
            />
            <TextField 
                multiline
                rows={10}
                label='Notes'
                inputRef={notesRef}
            />
            <Stack direction='row' spacing={2} sx={{'& button':{fontSize:'1.4rem', letterSpacing:'0.2rem'}}}>
                <Button variant="contained" onClick={onCancel} fullWidth>Cancel</Button>
                <Button variant="contained" color='warning' type='submit' fullWidth>Submit</Button>
            </Stack>
        </Stack>
    )
}

export default NewRefund
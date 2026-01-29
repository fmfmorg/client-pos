import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import { useEffect, useMemo, useRef, useState } from "react"
import { IDB } from "src/hooks/class-db"
import { CompleteOrderStoreNames, IRefundItem } from "src/interfaces"

const RefundItem = ({id}:{id:number}) => {
    const idb = useRef<IDB>(null)
    const loading = useRef(true)
    const [productID,setProductID] = useState('')
    const [quantity,setQuantity] = useState(0)
    const [amount,setAmount] = useState(0)
    const [dt,setDT] = useState(0)
    const [note,setNote] = useState('')
    const dateString = useMemo(()=>new Date(dt).toLocaleString('en-GB',{dateStyle:'short',timeStyle:'short'}),[dt])
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
            const e = await idb.current.getItem(id,CompleteOrderStoreNames.RefundItems) as IRefundItem
            setProductID(e.productID)
            setQuantity(e.quantity)
            setAmount(e.amount)
            setDT(e.dt)
            setNote(e.note)
        } catch (e) {}

        loading.current = false
    }

    useEffect(()=>{
        initDB()
    },[])

    useEffect(()=>{
        fetchRecord()
    },[id])

    return (
        <Stack direction='column'>
            <Typography fontWeight='bold'>{dateString}</Typography>
            <Stack direction='row' justifyContent='space-between'>
                <Typography>{productID} x{quantity}</Typography>
                <Typography>£{(amount * 0.01).toFixed(2)}</Typography>
            </Stack>
            {!!note && <Typography variant='caption'>{note}</Typography>}
        </Stack>
    )
}

export default RefundItem
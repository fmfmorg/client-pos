import TableCell from "@mui/material/TableCell"
import TableRow from "@mui/material/TableRow"
import Typography from "@mui/material/Typography"
import { useEffect, useRef, useState } from "react"
import { IDB } from "../../../../hooks/class-db"
import { CompleteOrderStoreNames, ICompleteOrderDiscountItem } from "../../../../interfaces"

const DiscountRow = ({id}:{id:number}) => {
    const idb = useRef<IDB>(null)
    const loading = useRef(true)
    const [name,setName] = useState('')
    const [amount,setAmount] = useState(0)
    const initDB = async() => {
        idb.current = new IDB()
        await idb.current.initDB()
        loading.current = false
        await updateDiscount()
    }
    const updateDiscount = async() => {
        if (loading.current) return
        loading.current = true

        try {
            const discountItem = await idb.current.getItem(id,CompleteOrderStoreNames.OrderDiscountItems) as ICompleteOrderDiscountItem
            setName(discountItem.name)
            setAmount(discountItem.amount)
        } catch (e) {}

        loading.current = false
    }

    useEffect(()=>{
        initDB()
    },[])

    useEffect(()=>{
        updateDiscount()
    },[id])

    return (
        <TableRow>
            <TableCell size='small'>
                <Typography variant="h5">{name}</Typography>
            </TableCell>
            <TableCell size='small'>
                <Typography variant="h5" align="right">-{(amount * 0.01).toFixed(2)}</Typography>
            </TableCell>
        </TableRow>
    )
}

export default DiscountRow
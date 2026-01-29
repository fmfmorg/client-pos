import { CustomEventKeys } from "@misc"
import TableCell from "@mui/material/TableCell"
import TableRow from "@mui/material/TableRow"
import { useEffect, useRef, useState } from "react"
import { IDB } from "src/hooks/class-db"
import Row from "./row"
import { IOrderDiscountItem, StoreNames } from "src/interfaces"

const DiscountRow = ({id}:{id:number}) => {
    const idb = useRef<IDB>(null)
    const loading = useRef(true)
    const [name,setName] = useState('')
    const [amount,setAmount] = useState(0)
    const initDB = async () => {
        idb.current = new IDB()
        await idb.current.initDB()
        loading.current = false
        await updateDetails()
    }
    const updateDetails = async() => {
        if (loading.current) return

        loading.current = true

        try {
            const discountItem = await idb.current.getItem(id, StoreNames.OrderDiscountItems) as IOrderDiscountItem
            const {name:_name, amount:_amount} = discountItem
            setName(_name)
            setAmount(_amount)
        } catch (e) {}

        loading.current = false
    }

    useEffect(()=>{
        initDB()
    },[])

    useEffect(()=>{
        updateDetails()
        document.addEventListener(CustomEventKeys.ORDER_ITEM_LIST_UPDATED,updateDetails)
        return () => {
            document.removeEventListener(CustomEventKeys.ORDER_ITEM_LIST_UPDATED,updateDetails)
        }
    },[id])
    
    return (
        // <TableRow>
        //     <TableCell>{name}</TableCell>
        //     <TableCell align="right">-{(amount * 0.01).toFixed(2)}</TableCell>
        // </TableRow>
        <Row name={name} amount={`-${(amount * 0.01).toFixed(2)}`} />
    )
}

export default DiscountRow
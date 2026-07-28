import TableCell from "@mui/material/TableCell"
import TableRow from "@mui/material/TableRow"
import Typography from "@mui/material/Typography"
import { useEffect, useRef, useState } from "react"
import { IDB } from "../../../hooks/class-db"
import { CompleteOrderStoreNames, ICompleteOrderItem } from "../../../interfaces"
import ImageCell from "./image-cell"

const OrderItemRow = ({id}:{id:number}) => {
    const idb = useRef<IDB>(null)
    const loading = useRef(true)
    const [price,setPrice] = useState(0)
    const [quantity,setQuantity] = useState(0)
    const [productID,setProductID] = useState('')
    const initDB = async () => {
        idb.current = new IDB()
        await idb.current.initDB()
        loading.current = false
        await updateContent()
    }
    const updateContent = async() => {
        if (loading.current) return
        loading.current = true

        try {
            const orderItem = await idb.current.getItem(id,CompleteOrderStoreNames.OrderItems) as ICompleteOrderItem
            setPrice(orderItem.price - orderItem.discount)
            setQuantity(orderItem.quantity)
            setProductID(orderItem.productID)
        } catch (e) {}

        loading.current = false
    }

    useEffect(()=>{
        initDB()
    },[])

    useEffect(()=>{
        updateContent()
    },[id])

    return (
        <TableRow>
            <TableCell>
                <Typography>{productID}</Typography>
                <Typography>£ {(price * 0.01).toFixed(2)}</Typography>
                <Typography>{quantity} pc</Typography>
            </TableCell>
            <ImageCell id={productID} />
        </TableRow>
    )
}

export default OrderItemRow
import { useContext, useEffect, useRef, useState } from "react"
import { OrderNumberContext } from "../contexts"
import { IDB } from "src/hooks/class-db"
import FormGroup from "@mui/material/FormGroup"
import FormControlLabel from "@mui/material/FormControlLabel"
import Checkbox from "@mui/material/Checkbox"
import { CompleteOrderStoreNames, ICompleteOrder } from "src/interfaces"

const OrderUploadedCheckbox = () => {
    const {orderNumber} = useContext(OrderNumberContext)
    const [checked,setChecked] = useState(false)
    const idb = useRef<IDB>(null)
    const initDB = async() => {
        idb.current = new IDB()
        await idb.current.initDB()
    }
    const orderNumberOnChange = async() => {
        const order = await idb.current.getItem(orderNumber,CompleteOrderStoreNames.Orders) as ICompleteOrder
        setChecked(order.uploaded)
    }
    const checkboxOnChange = async(_,v:boolean) => {
        const order = await idb.current.getItem(orderNumber,CompleteOrderStoreNames.Orders) as ICompleteOrder
        order.uploaded = v
        await idb.current.updateItem(order,CompleteOrderStoreNames.Orders)
        setChecked(v)
    }

    useEffect(()=>{
        initDB()
    },[])

    useEffect(()=>{
        if (!!orderNumber) orderNumberOnChange()
    },[orderNumber])
    
    return (
        <FormGroup>
            <FormControlLabel 
                control={<Checkbox checked={checked} />} 
                label='Uploaded' 
                onChange={checkboxOnChange}
                sx={{
                    '.MuiTypography-root':{color:'#fff'},
                    '.MuiSvgIcon-root':{fill:'#fff'},
                }}
            />
        </FormGroup>
    )
}

export default OrderUploadedCheckbox
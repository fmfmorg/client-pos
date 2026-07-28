import { useContext, useEffect, useRef, useState } from "react"
import { OrderNumberContext } from "../contexts"
import Autocomplete from "@mui/material/Autocomplete"
import TextField from "@mui/material/TextField"
import { IDB } from "../../../hooks/class-db"
import { CompleteOrderStoreNames } from "../../../interfaces"
import { broadcastChannelName, CustomEventKeys } from "@misc"

const OrderSelector = () => {
    const [orderNumbers,setOrderNumbers] = useState<string[]>([])
    const {orderNumber,updateOrderNumber} = useContext(OrderNumberContext)
    const idb = useRef<IDB>(null)
    const broadcastChannel = useRef<BroadcastChannel>(null)
    const initDB = async() => {
        idb.current = new IDB()
        await idb.current.initDB()
        await updateOrderNumbers()
    }
    const updateOrderNumbers = async() => {
        const _orderNumbers = await idb.current.getIDs(CompleteOrderStoreNames.Orders) as string[]
        setOrderNumbers(_orderNumbers)
    }
    const onBroadcastMessage = (e:MessageEvent<any>) => {
        switch (e.data) {
            case CustomEventKeys.ORDER_COMPLETE:
                updateOrderNumbers()
                break
            default: break;
        }
    }
    const onChange = (_:any, v:string|string[]|null) => {
        if (!!v && typeof v === 'string') updateOrderNumber(v)
    }

    useEffect(()=>{
        initDB()
        broadcastChannel.current = new BroadcastChannel(broadcastChannelName)
        broadcastChannel.current.addEventListener('message',onBroadcastMessage)
        return () => {
            broadcastChannel.current.removeEventListener('message',onBroadcastMessage)
            
        }
    },[])

    return (
        <Autocomplete 
            options={orderNumbers}
            value={orderNumber}
            onChange={onChange}
            renderInput={p => <TextField {...p} />}
            sx={{backgroundColor:'#fff',minWidth:'250px'}}
            size="small"
        />    
    )
}

export default OrderSelector
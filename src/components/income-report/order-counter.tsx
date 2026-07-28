import { broadcastChannelName, CustomEventKeys } from "@misc"
import TableCell from "@mui/material/TableCell"
import { useEffect, useRef, useState } from "react"
import { IDB } from "../../hooks/class-db"
import { CompleteOrderStoreNames, ICompleteOrder } from "../../interfaces"

const OrderCounter = (
    {
        dateUnix,
        firstRow,
    }:{
        dateUnix:number;
        firstRow:boolean;
    }
) => {
    const broadcastChannel = useRef<BroadcastChannel>(null)
    const idb = useRef<IDB>(null)
    const loading = useRef(true)
    const [count,setCount] = useState(0)
    const initDB = async() => {
        idb.current = new IDB()
        await idb.current.initDB()
        loading.current = false
        await updateCount()
    }
    const updateCount = async() => {
        if (loading.current) return
        loading.current = true

        try {
            const dayStart = new Date(dateUnix)
            dayStart.setHours(0,0,0,0)

            const dayEnd = new Date(dateUnix)
            dayEnd.setHours(23,59,59,999)

            const allOrders = await idb.current.getItems(CompleteOrderStoreNames.Orders) as ICompleteOrder[]
            setCount(allOrders.filter(e => e.dt > dayStart.valueOf() && e.dt < dayEnd.valueOf()).length)
        } catch (e) {}

        loading.current = false
    }
    const onBroadcastMessage = (e:MessageEvent<any>) => {
        switch (e.data) {
            case CustomEventKeys.ORDER_COMPLETE:
                if (firstRow) updateCount()
                break
            default: break;
        }
    }

    useEffect(()=>{
        initDB()
        return () => {
            broadcastChannel.current.close()
            
        }
    },[])

    useEffect(()=>{
        if (!broadcastChannel.current) broadcastChannel.current = new BroadcastChannel(broadcastChannelName)
        updateCount()
        broadcastChannel.current.addEventListener('message',onBroadcastMessage)
        return () => {
            broadcastChannel.current.removeEventListener('message',onBroadcastMessage)
        }
    },[dateUnix,firstRow])

    return (
        <TableCell sx={{textAlign:'right'}}>{count}</TableCell>
    )
}

export default OrderCounter
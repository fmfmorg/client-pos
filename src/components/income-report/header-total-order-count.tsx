import { broadcastChannelName, CustomEventKeys } from "@misc"
import Stack from "@mui/material/Stack"
import TableCell from "@mui/material/TableCell"
import Typography from "@mui/material/Typography"
import { useContext, useEffect, useRef, useState } from "react"
import { IDB } from "src/hooks/class-db"
import { CompleteOrderStoreNames, ICompleteOrder } from "src/interfaces"
import { DateContext } from "src/misc/date-selector/date-contexts"

const HeaderTotalOrderCount = () => {
    const broadcastChannel = useRef<BroadcastChannel>(null)
    const idb = useRef<IDB>(null)
    const loading = useRef(true)
    const [count,setCount] = useState(0)
    const {start,end} = useContext(DateContext)
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
            const allOrders = await idb.current.getItems(CompleteOrderStoreNames.Orders) as ICompleteOrder[]
            setCount(allOrders.filter(e => e.dt > start && e.dt < end).length)
        } catch (e) {}

        loading.current = false
    }
    const onBroadcastMessage = (e:MessageEvent<any>) => {
        switch (e.data) {
            case CustomEventKeys.ORDER_COMPLETE:
                updateCount()
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
    },[start,end])

    return (
        <TableCell>
            <Stack direction='row' justifyContent='space-between'>
                <Typography>Orders:</Typography>
                <Typography>{count}</Typography>
            </Stack>
        </TableCell>
    )
}

export default HeaderTotalOrderCount
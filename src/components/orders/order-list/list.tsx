import List from "@mui/material/List"
import { useContext, useEffect, useRef, useState } from "react"
import { IDB } from "src/hooks/class-db"
import { CompleteOrderStoreNames, ICompleteOrder } from "src/interfaces"
import { DateContext, OrderNumberContext } from "../contexts"
import ListItem from "@mui/material/ListItem"
import ListItemButton from "@mui/material/ListItemButton"
import ListItemText from "@mui/material/ListItemText"
import { broadcastChannelName, CustomEventKeys } from "@misc"
import { useTheme } from "@mui/material"

const OrderBtn = ({id}:{id:string}) => {
    const {palette:{grey}} = useTheme()
    const {updateOrderNumber,orderNumber} = useContext(OrderNumberContext)
    const onClick = () => updateOrderNumber(id)
    return (
        <ListItem sx={{backgroundColor: orderNumber === id ? grey[200] : 'transparent'}}>
            <ListItemButton onClick={onClick}>
                <ListItemText>{id}</ListItemText>
            </ListItemButton>
        </ListItem>
    )
}

const ListBody = () => {
    const idb = useRef<IDB>(null)
    const loading = useRef(true)
    const broadcastChannel = useRef<BroadcastChannel>(null)
    const {date} = useContext(DateContext)
    const [orderNumbers,setOrderNumbers] = useState<string[]>([])
    const initDB = async() => {
        idb.current = new IDB()
        await idb.current.initDB()
        loading.current = false
        await updateList()
    }
    const updateList = async() => {
        if (loading.current) return
        loading.current = true

        const allOrders = await idb.current.getItems(CompleteOrderStoreNames.Orders) as ICompleteOrder[]
        const end = date + 86400000

        setOrderNumbers(allOrders.filter(({dt})=>dt > date && dt < end).map(e => e.id).sort())

        loading.current = false
    }
    const onBroadcastMessage = (e:MessageEvent<any>) => {
        switch (e.data) {
            case CustomEventKeys.ORDER_COMPLETE:
                updateList()
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
        updateList()
        broadcastChannel.current.addEventListener('message',onBroadcastMessage)
        return () => {
            broadcastChannel.current.removeEventListener('message',onBroadcastMessage)
        }
    },[date])

    return (
        <List>
            {orderNumbers.map(e => <OrderBtn key={e} id={e} />)}
        </List>
    )
}

export default ListBody
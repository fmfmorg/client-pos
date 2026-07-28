import Context from "@components/contexts"
import Stack from "@mui/material/Stack"
import Table from "@mui/material/Table"
import TableBody from "@mui/material/TableBody"
import TableContainer from "@mui/material/TableContainer"
import { useContext, useEffect, useRef, useState } from "react"
import OrderItem from "./order-item"
import { CustomEventKeys, sleep } from "@misc"
import Box from "@mui/material/Box"
import { IDB } from "../../../hooks/class-db"
import { IOrderItem, StoreNames } from "../../../interfaces"

const OrderDetails = () => {
    const containerRef = useRef<HTMLDivElement>(null)
    const tableContainerRef = useRef<HTMLDivElement>(null)
    const tableBottomRef = useRef<HTMLDivElement>(null)
    const {currentOrderID} = useContext(Context)
    const [itemIDs,setItemIDs] = useState<number[]>([])
    const idb = useRef<IDB>(null)
    const initDB = async () => {
        idb.current = new IDB()
        await idb.current.initDB()
    }
    const fetchOrderDetails = async () => {
        try {
            const allOrderItems = await idb.current.getItems(StoreNames.OrderItems) as IOrderItem[]
            if (!allOrderItems.length) {
                setItemIDs([])
                return
            }
            const thisOrderItems = allOrderItems.filter(e => e.orderID === currentOrderID && !!e.qty)
            if (!thisOrderItems.length) {
                setItemIDs([])
                return
            }
            thisOrderItems.sort((a,b)=>a.dt - b.dt)
            setItemIDs([...thisOrderItems.map(e => e.id)])
        } catch (e) {}
    }

    const resizeContainer = () => {
        const marginTop = document.body.getBoundingClientRect().top
        const containerTop = containerRef.current.getBoundingClientRect().top
        containerRef.current.style.height = `calc(100vh - ${marginTop + containerTop}px)`
    }
    
    const scrollToTableBottom = async () => {
        await sleep(200)
        tableBottomRef.current.scrollIntoView({behavior:'smooth'})
    }

    useEffect(()=>{
        resizeContainer()
        initDB()


    },[])

    useEffect(()=>{
        fetchOrderDetails()
        document.addEventListener(CustomEventKeys.ORDER_ITEM_LIST_UPDATED,fetchOrderDetails)
        document.addEventListener(CustomEventKeys.ORDER_ITEM_NEW_ADDED,scrollToTableBottom)
        return () => {
            document.removeEventListener(CustomEventKeys.ORDER_ITEM_LIST_UPDATED,fetchOrderDetails)
            document.removeEventListener(CustomEventKeys.ORDER_ITEM_NEW_ADDED,scrollToTableBottom)
        }
    },[currentOrderID])
    
    return (
        <Stack direction='column' sx={{position:'relative'}} ref={containerRef}>
            <Box ref={tableContainerRef} sx={{overflowY:'auto'}}>
                {!!currentOrderID && !!itemIDs.length && <TableContainer>
                    <Table size='small'>
                        <TableBody>
                            {itemIDs.map(e => <OrderItem key={e} id={e} />)}
                        </TableBody>
                    </Table>
                </TableContainer>}
                <div ref={tableBottomRef} />
            </Box>
        </Stack>
    )
}

export default OrderDetails
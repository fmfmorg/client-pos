import AppBar from "@mui/material/AppBar"
import Box from "@mui/material/Box"
import Stack from "@mui/material/Stack"
import Toolbar from "@mui/material/Toolbar"
import OrderSelector from "./order-selector"
import TableContainer from "@mui/material/TableContainer"
import Table from "@mui/material/Table"
import TableBody from "@mui/material/TableBody"
import { useContext, useEffect, useRef, useState } from "react"
import { OrderNumberContext } from "../contexts"
import { IDB } from "../../../hooks/class-db"
import { CompleteOrderStoreNames, ICompleteOrderItem } from "../../../interfaces"
import OrderItemRow from "./order-item-row"
import OrderUploadedCheckbox from "./order-uploaded-checkbox"

const OrderContent = () => {
    const {orderNumber} = useContext(OrderNumberContext)
    const idb = useRef<IDB>(null)
    const [itemIDs,setItemIDs] = useState<number[]>([])
    const initDB = async() => {
        idb.current = new IDB()
        await idb.current.initDB()
    }
    const loadOrder = async() => {
        try {
            const allOrderItems = await idb.current.getItems(CompleteOrderStoreNames.OrderItems) as ICompleteOrderItem[]
            setItemIDs(allOrderItems.filter(e => e.orderID === orderNumber).map(e => e.id))
        } catch (e) {}
    }

    useEffect(()=>{
        initDB()
    },[])

    useEffect(()=>{
        if (!!orderNumber) loadOrder()
    },[orderNumber])

    return (
        <Box sx={{width:'100%'}}>
            <AppBar>
                <Toolbar />
            </AppBar>
            <Toolbar sx={theme => ({zIndex: theme.zIndex.drawer + 1, display:'flex',flexDirection:'row',position:'sticky',top:0})}>
                <Stack direction='row' justifyContent='space-between' columnGap={2} width='100%'>
                    <OrderSelector />
                    <OrderUploadedCheckbox />
                </Stack>
            </Toolbar>
            <TableContainer>
                <Table>
                    <TableBody>
                        {itemIDs.map(e => (<OrderItemRow key={e} id={e} />))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    )
}

export default OrderContent
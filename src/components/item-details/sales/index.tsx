import Table from "@mui/material/Table"
import TableBody from "@mui/material/TableBody"
import TableContainer from "@mui/material/TableContainer"
import TableHead from "@mui/material/TableHead"
import TableRow from "@mui/material/TableRow"
import TableCell from "@mui/material/TableCell"
import Grid from '@mui/material/Grid2'
import { useContext, useEffect, useRef, useState } from "react"
import { IDB } from "src/hooks/class-db"
import { ProductIdContext } from "../contexts"
import { CompleteOrderStoreNames, ICompleteOrderItem } from "src/interfaces"
import SalesRow from "./row"

const SalesTable = () => {
    const {productID} = useContext(ProductIdContext)
    const [idbID,setIdbIDs] = useState<number[]>([])
    const idb = useRef<IDB>(null)
    const loading = useRef(true)
    const initDB = async() => {
        idb.current = new IDB()
        await idb.current.initDB()
        loading.current = false
        await fetchRecords()
    }
    const fetchRecords = async() => {
        if (loading.current) return
        loading.current = true

        try {
            const allOrderItems = await idb.current.getItems(CompleteOrderStoreNames.OrderItems) as ICompleteOrderItem[]
            const orderItems = allOrderItems.filter(e => e.productID === productID)
            if (!!orderItems.length) {
                const ids = orderItems.sort((a,b)=>b.orderID > a.orderID ? 1 : -1).map(e => e.id)
                setIdbIDs([...ids])
            } else setIdbIDs([])
        } catch(e) {}

        loading.current = false
    }

    useEffect(()=>{
        initDB()
    },[])

    useEffect(()=>{
        fetchRecords()
    },[productID])

    return (
        <Grid size={5} sx={{height:'calc(100vh - 16px)',overflowY:'auto'}}>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Date</TableCell>
                            <TableCell>Order</TableCell>
                            <TableCell align='right'>Quantity</TableCell>
                            <TableCell align='right'>Price</TableCell>
                            <TableCell align='right'>Order Total</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {idbID.map(id => <SalesRow key={id} {...{id}} />)}
                    </TableBody>
                </Table>
            </TableContainer>
        </Grid>
    )
}

export default SalesTable
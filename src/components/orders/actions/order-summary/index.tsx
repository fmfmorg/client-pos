import { OrderNumberContext } from "@components/orders/contexts"
import Table from "@mui/material/Table"
import TableBody from "@mui/material/TableBody"
import TableCell from "@mui/material/TableCell"
import TableContainer from "@mui/material/TableContainer"
import TableRow from "@mui/material/TableRow"
import Typography from "@mui/material/Typography"
import { useContext, useEffect, useRef, useState } from "react"
import { IDB } from "../../../../hooks/class-db"
import { CompleteOrderStoreNames, ICompleteOrder, ICompleteOrderDiscountItem, ICompleteOrderItem, ISpecification, StoreNames } from "../../../../interfaces"
import DiscountRow from "./discount-row"
import Stack from "@mui/material/Stack"
import Box from "@mui/material/Box"

const OrderSummary = () => {
    const {orderNumber} = useContext(OrderNumberContext)
    const idb = useRef<IDB>(null)
    const loading = useRef(true)
    const [subtotal,setSubtotal] = useState(0)
    const [discount,setDiscount] = useState(0)
    const [discountIDs,setDiscountIDs] = useState<number[]>([])
    const [paymentMethod,setPaymentMethod] = useState('')
    const [dt,setDT] = useState(0)
    const initDB = async() => {
        idb.current = new IDB()
        await idb.current.initDB()
        loading.current = false
        await updateContent()
    }
    const updateContent = async() => {
        if (loading.current) return
        loading.current = true

        try {
            const [allOrderItems,allDiscountItems,order] = await Promise.all([
                idb.current.getItems(CompleteOrderStoreNames.OrderItems) as Promise<ICompleteOrderItem[]>,
                idb.current.getItems(CompleteOrderStoreNames.OrderDiscountItems) as Promise<ICompleteOrderDiscountItem[]>,
                idb.current.getItem(orderNumber,CompleteOrderStoreNames.Orders) as Promise<ICompleteOrder>,
            ])
            setSubtotal(allOrderItems.filter(e => e.orderID === orderNumber).map(e => (e.price - e.discount) * e.quantity).reduce((a,b)=>a+b,0))
            const discountItems = allDiscountItems.filter(e => e.orderID === orderNumber)
            setDiscount(!!discountItems.length ? discountItems.map(e => e.amount).reduce((a,b)=>a+b,0) : 0)
            setDiscountIDs(discountItems.sort((a,b)=>a.orderInReceipt - b.orderInReceipt).map(e => e.id))

            setDT(order.dt)

            const paymentMethodItem = await idb.current.getItem(order.paymentMethod,StoreNames.PaymentMethods) as ISpecification
            setPaymentMethod(paymentMethodItem.name)
        } catch (e) {}

        loading.current = false
    }

    useEffect(()=>{
        initDB()
    },[])

    useEffect(()=>{
        if (!!orderNumber) updateContent()
    },[orderNumber])

    return (
        <Box sx={{px:1}}>
            <TableContainer>
                <Table>
                    <TableBody>
                        {!!discount && <TableRow>
                            <TableCell size='small'>
                                <Typography variant="h5">Subtotal</Typography>
                            </TableCell>
                            <TableCell size='small'>
                                <Typography variant="h5" align="right">{(subtotal * 0.01).toFixed(2)}</Typography>
                            </TableCell>
                        </TableRow>}
                        {!!discountIDs.length && discountIDs.map(e => (<DiscountRow key={e} id={e} />))}
                        <TableRow>
                            <TableCell size='small'>
                                <Typography variant="h5" fontWeight={700}>Total</Typography>
                            </TableCell>
                            <TableCell size='small'>
                                <Typography variant="h4" align="right" fontWeight={900}>{((subtotal - discount) * 0.01).toFixed(2)}</Typography>
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell size='small'>
                                <Typography variant="h5">Paid by</Typography>
                            </TableCell>
                            <TableCell size='small'>
                                <Typography variant="h5" align='right'>{paymentMethod}</Typography>
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell size='small' colSpan={2}>
                                <Stack direction='row' justifyContent='space-between'>
                                    <Typography variant="h6">Date</Typography>
                                    <Typography variant="h6" align='right'>{new Date(dt).toLocaleString('en-GB',{dateStyle:'short',timeStyle:'short'})}</Typography>
                                </Stack>
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    )
}

export default OrderSummary
import Typography from "@mui/material/Typography"
import { FormEvent, useContext, useEffect, useRef, useState } from "react"
import { IDB } from "../../../hooks/class-db"
import { ProductIdContext } from "../contexts"
import { CompleteOrderStoreNames, ICompleteOrderItem, IProductExternal, IProductInternal, IRefundItem, ISkuMapItem, StoreNames } from "../../../interfaces"
import TableContainer from "@mui/material/TableContainer"
import Table from "@mui/material/Table"
import TableBody from "@mui/material/TableBody"
import TableRow from "@mui/material/TableRow"
import TableCell from "@mui/material/TableCell"
import IconButton from "@mui/material/IconButton"
import EditIcon from '@mui/icons-material/Edit';
import Stack from "@mui/system/Stack"
import TextField from '@mui/material/TextField';
import Button from "@mui/material/Button"
import { CustomEventKeys, dispatchNewEvent } from "@misc"

const Stock = () => {
    const {productID} = useContext(ProductIdContext)
    const stockShowRef = useRef<HTMLDivElement>(null)
    const stockEditRef = useRef<HTMLFormElement>(null)
    const displayShowRef = useRef<HTMLDivElement>(null)
    const displayEditRef = useRef<HTMLFormElement>(null)
    const stockInputRef = useRef<HTMLInputElement>(null)
    const displayInputRef = useRef<HTMLInputElement>(null)
    const [inShop,setInShop] = useState(0)
    const [stockQty,setStockQty] = useState(0)
    const [displayQty,setDisplayQty] = useState(0)
    const [price,setPrice] = useState(0)
    const idb = useRef<IDB>(null)
    const loading = useRef(true)
    const initDB = async() => {
        idb.current = new IDB()
        await idb.current.initDB()
        loading.current = false
        await loadStock()
    }
    const loadStock = async() => {
        if (loading.current) return
        loading.current = true

        try {
            const [
                allSkuMapItems,
                allProductsInternal,
                productExternal,
                allOrderItems,
                allRefundItems,
            ] = await Promise.all([
                idb.current.getItems(StoreNames.SkuMapItems) as Promise<ISkuMapItem[]>,
                idb.current.getItems(StoreNames.ProductsInternal) as Promise<IProductInternal[]>,
                idb.current.getItem(productID,StoreNames.ProductsExternal) as Promise<IProductExternal>,
                idb.current.getItems(CompleteOrderStoreNames.OrderItems) as Promise<ICompleteOrderItem[]>,
                idb.current.getItems(CompleteOrderStoreNames.RefundItems) as Promise<IRefundItem[]>,
            ])

            // quantity received
            const internalIDs = allSkuMapItems.filter(e => e.external === productID).map(e => e.internal)
            const productsInternal = allProductsInternal.filter(e => internalIDs.includes(e.id))
            const quantityReceived = Math.min(...productsInternal.map(e => e.receivedQuantity))

            // quantity sold
            const orderItems = allOrderItems.filter(e => e.productID === productID && !!e.rl)
            const quantitySold = !!orderItems.length ? orderItems.map(e => e.quantity).reduce((a,b)=>a+b,0) : 0

            // quantity returned
            const refundItems = allRefundItems.filter(e => e.productID === productID)
            const quantityReturned = !!refundItems.length ? refundItems.map(e => e.quantity).reduce((a,b)=>a+b,0) : 0

            setInShop(Math.max(0, quantityReceived + quantityReturned - quantitySold))
            setStockQty(productExternal.stock)
            const _displayQty = Math.max(0, quantityReceived + quantityReturned - quantitySold) - productExternal.stock
            setDisplayQty(_displayQty)
            setPrice(productExternal.price)
            stockInputRef.current.value = !!productExternal.stock ? productExternal.stock.toString() : ''
            displayInputRef.current.value = !!_displayQty ? _displayQty.toString() : ''
        } catch (e) {}

        loading.current = false

        stockCancelEditOnClick()
        displayCancelEditOnClick()
    }
    const stockEditBtnOnClick = () => {
        displayCancelEditOnClick()

        stockShowRef.current.style.display = 'none'
        stockEditRef.current.style.display = 'flex'
        stockInputRef.current.select()
    }
    const stockCancelEditOnClick = () => {
        stockShowRef.current.style.display = 'flex'
        stockEditRef.current.style.display = 'none'
    }
    const stockUpdateBtnOnClick = async(e:FormEvent) => {
        e.preventDefault()
        const value = +stockInputRef.current.value
        if (!isNaN(value)) {
            try {
                const p = await idb.current.getItem(productID,StoreNames.ProductsExternal) as IProductExternal
                p.stock = value
                p.stockLevelToBeUpdated = true
                
                await idb.current.updateItem(p,StoreNames.ProductsExternal)
                setStockQty(value)
                setDisplayQty(inShop - value)
                dispatchNewEvent(CustomEventKeys.STOCK_TO_BE_UPDATED,productID)
            } catch (e) {}
        }

        stockCancelEditOnClick()
    }

    const displayEditBtnOnClick = () => {
        stockCancelEditOnClick()

        displayShowRef.current.style.display = 'none'
        displayEditRef.current.style.display = 'flex'
        displayInputRef.current.select()
    }
    const displayCancelEditOnClick = () => {
        displayShowRef.current.style.display = 'flex'
        displayEditRef.current.style.display = 'none'
    }

    const displayUpdateBtnOnClick = async(e:FormEvent) => {
        e.preventDefault()
        const value = +displayInputRef.current.value
        if (!isNaN(value)) {
            const _stockQty = inShop - value
            try {
                const p = await idb.current.getItem(productID,StoreNames.ProductsExternal) as IProductExternal
                p.stock = _stockQty
                p.stockLevelToBeUpdated = true
                
                await idb.current.updateItem(p,StoreNames.ProductsExternal)
                setStockQty(_stockQty)
                setDisplayQty(value)
                dispatchNewEvent(CustomEventKeys.STOCK_TO_BE_UPDATED,productID)
            } catch (e) {}
        }

        displayCancelEditOnClick()
    }

    useEffect(()=>{
        initDB()
    },[])

    useEffect(()=>{
        loadStock()
    },[productID])

    return (
        <TableContainer>
            <Table sx={{width:'fit-content','* td':{borderBottom:0, pl:0}}}>
                <TableBody>
                    <TableRow>
                        <TableCell><Typography variant="h4" fontWeight={700}>Price:</Typography></TableCell>
                        <TableCell><Typography variant="h4" fontWeight={700}>{(price * 0.01).toFixed(2)}</Typography></TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell><Typography variant="h4" fontWeight={700}>Display:</Typography></TableCell>
                        {/* <TableCell><Typography variant="h4" fontWeight={700}>{inShop - stockQty}</Typography></TableCell> */}
                        <TableCell>
                            <Stack direction='row' ref={displayShowRef}>
                                <Stack direction='column' justifyContent='center' pr={1}><Typography variant="h4" fontWeight={700}>{displayQty}</Typography></Stack>
                                <IconButton onClick={displayEditBtnOnClick}><EditIcon fontSize="large" /></IconButton>
                            </Stack>
                            <Stack component='form' onSubmit={displayUpdateBtnOnClick} direction='row' ref={displayEditRef} sx={{display:'none'}} columnGap={1}>
                                <TextField inputRef={displayInputRef} />
                                <Button variant="contained" color='warning' type='submit' >Update</Button>
                                <Button variant="contained" onClick={displayCancelEditOnClick}>Cancel</Button>
                            </Stack>
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell><Typography variant="h4" fontWeight={700}>Stock:</Typography></TableCell>
                        <TableCell>
                            <Stack direction='row' ref={stockShowRef}>
                                <Stack direction='column' justifyContent='center' pr={1}><Typography variant="h4" fontWeight={700}>{stockQty}</Typography></Stack>
                                <IconButton onClick={stockEditBtnOnClick} sx={{display:'none'}}><EditIcon fontSize="large" /></IconButton>
                            </Stack>
                            <Stack component='form' onSubmit={stockUpdateBtnOnClick} direction='row' ref={stockEditRef} sx={{display:'none'}} columnGap={1}>
                                <TextField inputRef={stockInputRef} />
                                <Button variant="contained" color='warning' type='submit' >Update</Button>
                                <Button variant="contained" onClick={stockCancelEditOnClick}>Cancel</Button>
                            </Stack>
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </TableContainer>
    )
}

export default Stock
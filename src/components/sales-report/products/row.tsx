import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import { useContext, useEffect, useRef, useState } from 'react';
import { IDB } from 'src/hooks/class-db';
import { CompleteOrderStoreNames, ICompleteOrder, ICompleteOrderItem, IProductExternal, IProductInternal, IRefundItem, ISkuMapItem, StoreNames } from 'src/interfaces';
import { DateContext } from '../../../misc/date-selector/date-contexts';
import Typography from '@mui/material/Typography';
import Images from './images';
import { broadcastChannelName, CustomEventKeys } from '@misc';

const ProductRow = ({id}:{id:string}) => {
    const broadcastChannel = useRef<BroadcastChannel>(null)
    const idb = useRef<IDB>(null)
    const loading = useRef(true)
    const {start,end} = useContext(DateContext)
    const [price,setPrice] = useState(0)
    const [quantitySold,setQuantitySold] = useState(0)
    const [quantityLeft,setQuantityLeft] = useState(0)
    const initDB = async() => {
        idb.current = new IDB()
        await idb.current.initDB()
        try {
            const p = await idb.current.getItem(id,StoreNames.ProductsExternal) as IProductExternal
            setPrice(p.price)
        } catch (e) {}
        loading.current = false
        await updateQuantity()
    }
    const updateQuantity = async() => {
        if (loading.current) return

        loading.current = true

        try {
            const [allOrders,allOrderItems,allProductsInternal,allSkuMapItems,allRefundItems] = await Promise.all([
                idb.current.getItems(CompleteOrderStoreNames.Orders) as Promise<ICompleteOrder[]>,
                idb.current.getItems(CompleteOrderStoreNames.OrderItems) as Promise<ICompleteOrderItem[]>,
                idb.current.getItems(StoreNames.ProductsInternal) as Promise<IProductInternal[]>,
                idb.current.getItems(StoreNames.SkuMapItems) as Promise<ISkuMapItem[]>,
                idb.current.getItems(CompleteOrderStoreNames.RefundItems) as Promise<IRefundItem[]>,
            ])
            const orderNumbers = allOrders.filter(e => e.dt >= start && e.dt <= end).map(e => e.id)
            const _quantity = allOrderItems
                .filter(e => e.productID === id && orderNumbers.includes(e.orderID))
                .map(e => {
                    const refundItems = allRefundItems.filter(d => d.orderID === e.orderID && d.productID === e.productID)
                    if (!refundItems) return e;
                    return {...e,quantity:e.quantity - refundItems.map(d => d.quantity).reduce((a,b)=>a+b,0)}
                })
                .map(e => e.quantity).reduce((a,b)=>a+b,0)
            setQuantitySold(_quantity)

            const internalIDs = allSkuMapItems.filter(e => e.external === id).map(e => e.internal)
            const quantityReceived = Math.min(...allProductsInternal.filter(e => internalIDs.includes(e.id)).map(e => e.receivedQuantity))
            const quantitySold = allOrderItems
                .filter(e => e.productID === id)
                .map(e => {
                    const refundItems = allRefundItems.filter(d => d.orderID === e.orderID && d.productID === e.productID)
                    if (!refundItems) return e;
                    return {...e,quantity:e.quantity - refundItems.map(d => d.quantity).reduce((a,b)=>a+b,0)}
                })
                .map(e => e.quantity)
                .reduce((a,b)=>a+b,0)
            setQuantityLeft(Math.max(quantityReceived - quantitySold, 0))
        } catch (e) {}

        loading.current = false
    }
    const onBroadcastMessage = (e:MessageEvent<any>) => {
        switch (e.data) {
            case CustomEventKeys.ORDER_COMPLETE:
                updateQuantity()
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
        if (!broadcastChannel.current) broadcastChannel.current = new BroadcastChannel(broadcastChannelName);
        broadcastChannel.current.addEventListener('message',onBroadcastMessage)
        updateQuantity()

        return () => {
            broadcastChannel.current.removeEventListener('message',onBroadcastMessage)
        }
    },[start,end])

    return (
        <TableRow>
            <TableCell>
                <Typography>{id}</Typography>
                <Typography>£{(price * 0.01).toFixed(2)}</Typography>
                <Typography variant='h5'>{quantitySold} pc</Typography>
                <Typography>Left: {quantityLeft} pc</Typography>
            </TableCell>
            <Images {...{id}} />
        </TableRow>
    )
}

export default ProductRow
import { useContext, useEffect, useRef, useState } from "react"
import { IDB } from "../../../hooks/class-db"
import { DateContext } from "../../../misc/date-selector/date-contexts"
import { CompleteOrderStoreNames, ICompleteOrder, ICompleteOrderItem, IProductInternal, IProductTypeMapItem, IRefundItem, ISkuMapItem, StoreNames } from "../../../interfaces"
import TableContainer from '@mui/material/TableContainer';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import ProductRow from "./row";
import { broadcastChannelName, CustomEventKeys } from "@misc";
import { ProductTypeContext } from "../contexts";

const ProductList = () => {
    const {selectSubTypes,productTypes,productSubTypes} = useContext(ProductTypeContext)
    const broadcastChannel = useRef<BroadcastChannel>(null)
    const [productIDs,setProductIDs] = useState<string[]>([])
    const idb = useRef<IDB>(null)
    const loading = useRef(true)
    const {start,end} = useContext(DateContext)
    const initDB = async() => {
        idb.current = new IDB()
        await idb.current.initDB()
        loading.current = false
        await updateList()
    }
    const updateList = async() => {
        if (loading.current) return
        loading.current = true

        try {
            const [allOrders,allOrderItems,allSkuMapItems,allProductsInternal,allProductTypeMapItems,allRefundItems] = await Promise.all([
                idb.current.getItems(CompleteOrderStoreNames.Orders) as Promise<ICompleteOrder[]>,
                idb.current.getItems(CompleteOrderStoreNames.OrderItems) as Promise<ICompleteOrderItem[]>,
                idb.current.getItems(StoreNames.SkuMapItems) as Promise<ISkuMapItem[]>,
                idb.current.getItems(StoreNames.ProductsInternal) as Promise<IProductInternal[]>,
                idb.current.getItems(StoreNames.ProductTypeMapItems) as Promise<IProductTypeMapItem[]>,
                idb.current.getItems(CompleteOrderStoreNames.RefundItems) as Promise<IRefundItem[]>,
            ])
            const orderNumbers = allOrders.filter(e => e.dt >= start && e.dt <= end).map(e => e.id)
            const orderItems = allOrderItems
                .filter(e => orderNumbers.includes(e.orderID))
                .map(e => {
                    const refundItems = allRefundItems.filter(d => d.orderID === e.orderID && d.productID === e.productID)
                    if (!refundItems) return e;
                    return {...e,quantity:e.quantity - refundItems.map(d => d.quantity).reduce((a,b)=>a+b,0)}
                })
                .filter(e => !!e.quantity)
            
            if (!!orderItems.length){
                const productIDs = [...new Set(orderItems.map(e => e.productID))]

                let arr:{productID:string;quantity:number}[] = []

                for (const productID of productIDs) {
                    let inSelection = true

                    if (!selectSubTypes && !!productTypes.length) {
                        const internalProductIDs = allSkuMapItems.filter(e => e.external === productID).map(e => e.internal)
                        const thisProductTypeIDs = [...new Set(allProductsInternal.filter(e => internalProductIDs.includes(e.id)).map(e => e.productTypeID))]
                        const thisProductMainTypes = [...new Set(allProductTypeMapItems.filter(e => thisProductTypeIDs.includes(e.id)).map(e => e.mainTypeID))]
                        inSelection = productTypes.some(e => thisProductMainTypes.includes(e))
                    } else if (selectSubTypes && !!productSubTypes.length){
                        const internalProductIDs = allSkuMapItems.filter(e => e.external === productID).map(e => e.internal)
                        const thisProductTypeIDs = [...new Set(allProductsInternal.filter(e => internalProductIDs.includes(e.id)).map(e => e.productTypeID))]
                        const thisProductSubTypes = [...new Set(allProductTypeMapItems.filter(e => thisProductTypeIDs.includes(e.id)).map(e => e.subTypeID))]
                        inSelection = productSubTypes.some(e => thisProductSubTypes.includes(e))
                    }

                    if (inSelection){
                        const quantity = orderItems.filter(e => e.productID === productID).map(e => e.quantity).reduce((a,b)=>a+b,0)
                        arr = [...arr,{productID,quantity}]
                    }
                }

                setProductIDs([...arr.sort((a,b)=>b.quantity - a.quantity).map(e => e.productID)])
            } else setProductIDs([])
        } catch (e) {}

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
        if (!broadcastChannel.current) broadcastChannel.current = new BroadcastChannel(broadcastChannelName);
        broadcastChannel.current.addEventListener('message',onBroadcastMessage)
        updateList()

        return () => {
            broadcastChannel.current.removeEventListener('message',onBroadcastMessage)
        }
    },[start,end,productTypes,selectSubTypes,productSubTypes])

    return (
        <TableContainer>
            <Table>
                <TableBody>
                    {productIDs.map(id => <ProductRow key={id} {...{id}} />)}
                </TableBody>
            </Table>
        </TableContainer>
    )
}

export default ProductList
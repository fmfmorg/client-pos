import { useContext, useEffect, useRef, useState } from "react"
import { IDB } from "../../../hooks/class-db"
import { DateContext } from "../../../misc/date-selector/date-contexts"
import { CompleteOrderStoreNames, ICompleteOrder, ICompleteOrderItem, IListDetails, IProductExternal, IProductInternal, IProductTypeMapItem, IRefundItem, ISkuMapItem, StoreNames } from "../../../interfaces"
import TableContainer from '@mui/material/TableContainer';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import ProductRow from "./row";
import { broadcastChannelName, CustomEventKeys } from "@misc";
import { ProductTypeContext } from "../contexts";
import { ISalesRow } from "./interface";

const ProductList = () => {
    const {selectSubTypes,productTypes,productSubTypes} = useContext(ProductTypeContext)
    const broadcastChannel = useRef<BroadcastChannel>(null)
    const [rows,setRows] = useState<ISalesRow[]>([])
    const idb = useRef<IDB>(null)
    const [periodStart,setPeriodStart] = useState(0)
    const [periodEnd,setPeriodEnd] = useState(0)
    const loading = useRef(false)
    const initDB = async() => {
        idb.current = new IDB()
        await idb.current.initDB()
    }
    const updateList = async() => {
        // if (loading.current) return
        // loading.current = true
        await updateProductList(periodStart,periodEnd)
        // loading.current = false
    }
    const onBroadcastMessage = (e:MessageEvent<any>) => {
        switch (e.data) {
            case CustomEventKeys.ORDER_COMPLETE:
                updateList()
                break
            default: break;
        }
    }

    const updateProductList = async(start:number,end:number) => {
        const [allOrders,allOrderItems,allSkuMapItems,allProductsInternal,allProductTypeMapItems,allRefundItems,allProductsExternal] = await Promise.all([
            idb.current.getItems(CompleteOrderStoreNames.Orders) as Promise<ICompleteOrder[]>,
            idb.current.getItems(CompleteOrderStoreNames.OrderItems) as Promise<ICompleteOrderItem[]>,
            idb.current.getItems(StoreNames.SkuMapItems) as Promise<ISkuMapItem[]>,
            idb.current.getItems(StoreNames.ProductsInternal) as Promise<IProductInternal[]>,
            idb.current.getItems(StoreNames.ProductTypeMapItems) as Promise<IProductTypeMapItem[]>,
            idb.current.getItems(CompleteOrderStoreNames.RefundItems) as Promise<IRefundItem[]>,
            idb.current.getItems(StoreNames.ProductsExternal) as Promise<IProductExternal[]>,
        ])

        const orderNumbers = allOrders.filter(e => e.dt >= start && e.dt <= end).map(e => e.id)
        const orderItems = allOrderItems
            .filter(e => orderNumbers.includes(e.orderID) && e.rl)
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

            const finalProductIDs = arr.sort((a,b)=>b.quantity - a.quantity).map(e => e.productID)

            let result:ISalesRow[] = []

            for (const idExternal of finalProductIDs) {
                const orderNumbers = allOrders.filter(e => e.dt >= start && e.dt <= end).map(e => e.id)
                const quantitySold = allOrderItems
                    .filter(e => e.productID === idExternal && e.rl && orderNumbers.includes(e.orderID))
                    .map(e => {
                        const refundItems = allRefundItems.filter(d => d.orderID === e.orderID && d.productID === e.productID)
                        if (!refundItems) return e;
                        return {...e,quantity:e.quantity - refundItems.map(d => d.quantity).reduce((a,b)=>a+b,0)}
                    })
                    .map(e => e.quantity).reduce((a,b)=>a+b,0)
                const idsInternal = allSkuMapItems.filter(e => e.external === idExternal).map(e => e.internal)
                const totalQuantityReceived = Math.min(...allProductsInternal.filter(e => idsInternal.includes(e.id)).map(e => e.receivedQuantity))
                const totalQuantitySold = allOrderItems
                    .filter(e => e.productID === idExternal && e.rl)
                    .map(e => {
                        const refundItems = allRefundItems.filter(d => d.orderID === e.orderID && d.productID === e.productID)
                        if (!refundItems) return e;
                        return {...e,quantity:e.quantity - refundItems.map(d => d.quantity).reduce((a,b)=>a+b,0)}
                    })
                    .map(e => e.quantity)
                    .reduce((a,b)=>a+b,0)

                const quantityLeft = Math.max(totalQuantityReceived - totalQuantitySold, 0)

                const productExternal = allProductsExternal.find(e => e.id === idExternal)
                let price = 0
                if (!!productExternal){
                    price = productExternal.price - productExternal.discount
                }

                result.push({
                    idExternal,
                    price,
                    quantityLeft,
                    quantitySold,
                    idsInternal
                })
            }
            setRows([...result])
        } else setRows([])
    }

    const updateBtnOnClick = async (e:CustomEvent<IListDetails>) => {
        const {start,end} = e.detail

        await updateProductList(start,end)

        setPeriodStart(start)
        setPeriodEnd(end)
    }

    useEffect(()=>{
        initDB()
        // broadcastChannel.current = new BroadcastChannel(broadcastChannelName);
        // return () => {
        //     broadcastChannel.current.close()
        // }
    },[])

    useEffect(()=>{
        document.addEventListener(CustomEventKeys.REFRESH_LIST,updateBtnOnClick)
        // broadcastChannel.current.addEventListener('message',onBroadcastMessage)

        return () => {
            document.removeEventListener(CustomEventKeys.REFRESH_LIST,updateBtnOnClick)
            // broadcastChannel.current.removeEventListener('message',onBroadcastMessage)
        }
    },[periodStart,periodEnd,productTypes,selectSubTypes,productSubTypes])

    return (
        <TableContainer>
            <Table>
                <TableBody>
                    {rows.map(e => <ProductRow key={e.idExternal} {...e} />)}
                    {/* {productIDs.map(id => <ProductRow key={id} {...{id}} />)} */}
                </TableBody>
            </Table>
        </TableContainer>
    )
}

export default ProductList
import Checkbox from "@mui/material/Checkbox"
import ImageListItem from "@mui/material/ImageListItem"
import ImageListItemBar from "@mui/material/ImageListItemBar"
import Typography from "@mui/material/Typography"
import { SyntheticEvent, useEffect, useRef, useState } from "react"
import Rating from '@mui/material/Rating';
import { IDB } from "../../hooks/class-db"
import { CompleteOrderStoreNames, ICompleteOrderItem, IProductExternal, IProductInternal, IRefundItem, ISkuMapItem, StoreNames } from "../../interfaces"

const SingleItem = ({id}:{id:string}) => {
    const idb = useRef<IDB>(null)
    const [internalID,setInternalID] = useState('')
    const [keepInColl,setKeepInColl] = useState(0)
    const [displayQty,setDisplayQty] = useState(0)
    const [stockQty,setStockQty] = useState(0)
    const [price,setPrice] = useState(0)
    const [url,setURL] = useState('#')
    const [variation,setVariation] = useState('')
    const initDB = async() => {
        idb.current = new IDB()
        await idb.current.initDB()

        try {
            const [
                productExternal,
                allProductsInternal,
                allSkuMapItems,
                allOrderItems,
                allRefundItems,
            ] = await Promise.all([
                idb.current.getItem(id,StoreNames.ProductsExternal) as Promise<IProductExternal>,
                idb.current.getItems(StoreNames.ProductsInternal) as Promise<IProductInternal[]>,
                idb.current.getItems(StoreNames.SkuMapItems) as Promise<ISkuMapItem[]>,
                idb.current.getItems(CompleteOrderStoreNames.OrderItems) as Promise<ICompleteOrderItem[]>,
                idb.current.getItems(CompleteOrderStoreNames.RefundItems) as Promise<IRefundItem[]>,
            ])
            const _internalID = allSkuMapItems.find(e => e.external === id).internal
            setInternalID(_internalID)
            setKeepInColl(productExternal.keepInCollection)
            setPrice(productExternal.price - productExternal.discount)

            const productInternal = allProductsInternal.find(e => e.id === _internalID)
            const receivedQuantity = productInternal.receivedQuantity
            const orderQty = allOrderItems.filter(e => e.productID === id).map(e => e.quantity).reduce((a,b)=>a+b,0)
            const refundQty = allRefundItems.filter(e => e.productID === id).map(e => e.quantity).reduce((a,b)=>a+b,0)
            setVariation(productInternal.variation)

            const _stockQty = Math.max(receivedQuantity - orderQty + refundQty,0)
            setStockQty(_stockQty)
            setDisplayQty(_stockQty - (productExternal.stock || 0))
            
            setURL(productInternal.url)
        } catch (e) {}
    }
    const onChange = async(_:SyntheticEvent,value:number | null) => {
        const newValue = value | 0
        setKeepInColl(newValue)
        const i = await idb.current.getItem(id,StoreNames.ProductsExternal) as IProductExternal
        await idb.current.updateItem({...i,keepInCollection:newValue,dbToBeUpdated:true},StoreNames.ProductsExternal)
    }

    useEffect(()=>{
        initDB()
    },[])

    return (
        <ImageListItem sx={{aspectRatio: "1 / 1"}}>
            <a style={{height:'100%'}} href={url} target="_blank">
                <img 
                    src={`https://media-admin.fairymade.co/${internalID}.avif`}
                    width='100%'
                    title={variation}
                    style={{objectFit:'cover',objectPosition:'center',width:'100%',height:'100%'}}
                />
            </a>
            <ImageListItemBar 
                title={<Typography variant='body2'>{id.substring(1)} - £{(price * 0.01).toFixed(0)} - {displayQty}pc - {stockQty}pc</Typography>} 
                actionIcon={
                    <Rating 
                        value={keepInColl}
                        onChange={onChange}
                        size="small"
                    />
                }
                sx={{
                    '.MuiImageListItemBar-titleWrap':{
                        py:0,
                        pl:1,
                    }
                }}
            />
        </ImageListItem>
    )
}

export default SingleItem
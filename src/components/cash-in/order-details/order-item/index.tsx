import ImageList from "@mui/material/ImageList"
import ImageListItem from "@mui/material/ImageListItem"
import ImageListItemBar from "@mui/material/ImageListItemBar"
import TableCell from "@mui/material/TableCell"
import TableRow from "@mui/material/TableRow"
import Typography from "@mui/material/Typography"
import { useEffect, useRef, useState } from "react"
import QuantityField from "./quantity"
import { IDB } from "../../../../hooks/class-db"
import { IOrderItem, IProductExternal, IProductInternal, ISkuMapItem, StoreNames } from "../../../../interfaces"

const Image = ({id}:{id:string}) => {
    const [imgSrc,setImgSrc] = useState('')
    const idb = useRef<IDB>(null);
    const loading = useRef(true)
    const initDB = async() => {
        idb.current = new IDB()
        await idb.current.initDB()
        loading.current = false
        await getImageSrc()
    }
    const getImageSrc = async() => {
        if (loading.current) return

        loading.current = true

        try {
            const productInternal = await idb.current.getItem(id, StoreNames.ProductsInternal) as IProductInternal
            setImgSrc(productInternal.image)
        } catch (e) {}

        loading.current = false
    }

    useEffect(()=>{
        initDB()
    },[])

    useEffect(()=>{
        getImageSrc()
    },[id])

    return (
        <ImageListItem sx={{aspectRatio: "1 / 1"}}>
            <img 
                // src={imgSrc} 
                src={`https://media-admin.fairymade.co/${id}.avif`}
                loading='lazy'
                width='100%'
                style={{objectFit:'cover',objectPosition:'center',width:'100%',height:'100%'}}
            />
            <ImageListItemBar 
                title={<Typography variant='body2'>{id}</Typography>} 
                sx={{
                    '.MuiImageListItemBar-titleWrap':{
                        py:0,textAlign:'center'
                    }
                }}
            />
        </ImageListItem>
    )
}

const ImageCell = ({id}:{id:string}) => {
    const idb = useRef<IDB>(null)
    const loading = useRef(true)
    const [internalIDs,setInternalIDs] = useState<string[]>([])
    const initDB = async() => {
        idb.current = new IDB()
        await idb.current.initDB()
        loading.current = false
        await getInternalIDs()
    }
    const getInternalIDs = async() => {
        if (loading.current) return

        loading.current = true

        try {
            const allSkuMapItems = await idb.current.getItems(StoreNames.SkuMapItems) as ISkuMapItem[]
            if (!allSkuMapItems || !allSkuMapItems.length) {
                setInternalIDs([])
                loading.current = false
                return
            }
            const _internalIDs = allSkuMapItems.filter(e => e.external === id).map(e => e.internal)
            setInternalIDs([..._internalIDs])
        } catch (e) {}

        loading.current = false
    }

    useEffect(()=>{
        initDB()
    },[])

    useEffect(()=>{
        getInternalIDs()
    },[id])

    if (!!internalIDs.length) return (
        <ImageList cols={4} sx={{my:0}}>
            {internalIDs.map(_id => <Image key={_id} id={_id} />)}
        </ImageList>
    )
    return <></>
}

const OrderItem = ({id}:{id:number}) => {
    const loading = useRef(true)
    const [externalID,setExternalID] = useState('')
    const [price,setPrice] = useState(0)
    const [discount,setDiscount] = useState(0)
    const idb = useRef<IDB>(null)
    const initDB = async () => {
        idb.current = new IDB()
        await idb.current.initDB()
        loading.current = false
        await getOrderItem()
    }
    const getOrderItem = async() => {
        if (loading.current) return

        loading.current = true
        
        try {
            const orderItem = await idb.current.getItem(id, StoreNames.OrderItems) as IOrderItem
            if (!orderItem){
                loading.current = false
                return
            }
            const {qty:_qty,productID} = orderItem
            const productExternal = await idb.current.getItem(productID, StoreNames.ProductsExternal) as IProductExternal
            if (!productExternal){
                loading.current = false
                return
            }
            const {price:_price,discount:_discount} = productExternal
            setDiscount(_discount)
            setPrice(_price)
            setExternalID(productID)
        } catch (e) {}

        loading.current = false
    }

    useEffect(()=>{
        initDB()
    },[])

    if (!!externalID) return (
        <TableRow>
            <TableCell>
                <Typography variant='h5'>{externalID}</Typography>
                <Typography variant="h4" fontWeight='900'>£ {((price - discount) * 0.01).toFixed(2)}</Typography>
                <QuantityField id={id} />
            </TableCell>
            <TableCell>
                <ImageCell id={externalID} />
            </TableCell>
        </TableRow>
    )
    return <></>
}

export default OrderItem
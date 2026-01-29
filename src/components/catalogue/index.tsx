'use client'

import { useEffect, useRef, useState } from "react";
import { IDB } from "src/hooks/class-db";
import { IProductExternal, ISkuMapItem, StoreNames } from "src/interfaces";
import ImageList from '@mui/material/ImageList';
import ImageListItem from '@mui/material/ImageListItem';
import ImageListItemBar from '@mui/material/ImageListItemBar';

const Picture = ({id}:{id:string}) => {
    const [internalID,setInternalID] = useState('')
    const [price,setPrice] = useState(0)
    const idb = useRef<IDB>(null);
    const initDB = async() => {
        idb.current = new IDB()
        await idb.current.initDB()

        try {
            const thisProduct = await idb.current.getItem(id,StoreNames.ProductsExternal) as IProductExternal
            setPrice(thisProduct.price - thisProduct.discount)
        } catch (e) {}

        try {
            const skuMapItems = await idb.current.getItems(StoreNames.SkuMapItems) as ISkuMapItem[]
            const thisSkuMapItem = skuMapItems.find(e => e.external === id)
            setInternalID(thisSkuMapItem.internal)
        } catch (e) {}
    }

    useEffect(()=>{
        initDB()
    },[])

    if (!!internalID) return (
        <ImageListItem>
            <img src={`https://media-admin.fairymade.co/${internalID}.avif`} loading='eager' />
            <ImageListItemBar subtitle={`${id} - £${(price * 0.01).toFixed(2)}`} />
        </ImageListItem>
    )

    return (
        <></>
    )
}

const Catalogue = () => {
    const idb = useRef<IDB>(null);
    const [internalSkuIDs,setInternalSkuIDs] = useState<string[]>([])
    const initDB = async () => {
        idb.current = new IDB()
        await idb.current.initDB()
        const externalProducts = await idb.current.getItems(StoreNames.ProductsExternal) as IProductExternal[]
        const externalProductsWithPrices = externalProducts.filter(e => !!e.price)
        const skuMapItems = await idb.current.getItems(StoreNames.SkuMapItems) as ISkuMapItem[]
        const finalProducts = externalProductsWithPrices.filter(e => skuMapItems.filter(d => d.external === e.id).length === 1)
        const ids = finalProducts.map(e => e.id)
        setInternalSkuIDs(ids.slice(0,125))
    }

    useEffect(()=>{
        initDB()
        document.title = 'Catalogue'
    },[])

    return (
        <ImageList sx={{width:'100vw'}} cols={5}>
            {internalSkuIDs.map(e => <Picture key={e} id={e} />)}
        </ImageList>
    )
}

export default Catalogue
'use client'

import { useEffect, useRef, useState } from "react";
import { IDB } from "../../hooks/class-db";
import { StoreNames } from "../../interfaces";
import ImageList from '@mui/material/ImageList';
import ImageListItem from '@mui/material/ImageListItem';


const Picture = ({id}:{id:string}) => {
    return (
        <ImageListItem>
            <img src={`https://media-admin.fairymade.co/${id}.avif`} loading='eager' />
        </ImageListItem>
    )
}

const LoadPictures = () => {
    const idb = useRef<IDB>(null);
    const [internalSkuIDs,setInternalSkuIDs] = useState<string[]>([])
    const initDB = async () => {
        idb.current = new IDB()
        await idb.current.initDB()
        const ids = await idb.current.getIDs(StoreNames.ProductsInternal) as string[]
        setInternalSkuIDs(ids.sort().reverse())
    }

    useEffect(()=>{
        initDB()
        document.title = 'Load Pictures'
    },[])

    return (
        <ImageList sx={{width:'100vw'}} cols={15}>
            {internalSkuIDs.map(e => <Picture key={e} id={e} />)}
        </ImageList>
    )
}

export default LoadPictures
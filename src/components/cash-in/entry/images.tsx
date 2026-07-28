import ImageList from '@mui/material/ImageList';
import ImageListItem from '@mui/material/ImageListItem';
import ImageListItemBar from '@mui/material/ImageListItemBar'
import Typography from '@mui/material/Typography';
import { useEffect, useRef, useState } from 'react';
import { IDB } from '../../../hooks/class-db';
import { StoreNames } from '../../../interfaces';

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
            const productInternal = await idb.current.getItem(id, StoreNames.ProductsInternal)
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

    // if (!!imgSrc) 
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

const Images = ({id}:{id:string}) => {
    const [internalIDs,setInternalIDs] = useState<string[]>([])
    const loading = useRef(true)
    const idb = useRef<IDB>(null);
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
            const skuMapItems = await idb.current.getItems(StoreNames.SkuMapItems)
            const _internalIDs = skuMapItems.filter(e => e.external === id).map(e => e.internal)
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
        <ImageList cols={2} sx={{my:0}}>
            {internalIDs.map(_id => <Image key={_id} id={_id} />)}
        </ImageList>
    )
    return <></>
}

export default Images
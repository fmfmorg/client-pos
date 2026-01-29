import ImageListItem from '@mui/material/ImageListItem';
import ImageListItemBar from '@mui/material/ImageListItemBar'
import Typography from '@mui/material/Typography';
import { useEffect, useRef, useState } from 'react';
import { IDB } from 'src/hooks/class-db';
import { ISkuMapItem, StoreNames } from 'src/interfaces';
import Quantity from './quantity';

const RestockItem = ({id}:{id:string}) => {
    const idb = useRef<IDB>(null)
    const [internalID,setInternalID] = useState('')
    const initDB = async() => {
        idb.current = new IDB()
        await idb.current.initDB()
        
        try {
            const allSkuMapItems = await idb.current.getItems(StoreNames.SkuMapItems) as ISkuMapItem[]
            const skuMapItem = allSkuMapItems.find(e => e.external === id)
            setInternalID(skuMapItem.internal)
        } catch (e) {}
    }

    useEffect(()=>{
        initDB()
    },[])

    return (
        <ImageListItem sx={{aspectRatio: "1 / 1"}}>
            <img 
                // src={imgSrc} 
                src={`https://media-admin.fairymade.co/${internalID}.avif`}
                loading='lazy'
                width='100%'
                style={{objectFit:'cover',objectPosition:'center',width:'100%',height:'100%'}}
            />
            <ImageListItemBar 
                title={<Typography variant='body2'>{internalID}</Typography>} 
                actionIcon={<Quantity id={internalID} />}
                sx={{
                    '.MuiImageListItemBar-titleWrap':{
                        py:0,textAlign:'center'
                    },
                    backgroundColor:'rgba(0,0,0,0.25)'
                }}
            />
        </ImageListItem>
    )
}

export default RestockItem
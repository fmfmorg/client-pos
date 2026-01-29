import TableCell from '@mui/material/TableCell';
import ImageList from '@mui/material/ImageList';
import { useEffect, useRef, useState } from 'react';
import { IDB } from 'src/hooks/class-db';
import { ISkuMapItem, StoreNames } from 'src/interfaces';
import ImageListItem from '@mui/material/ImageListItem';
import ImageListItemBar from '@mui/material/ImageListItemBar';
import Typography from '@mui/material/Typography';

const Image = ({id}:{id:string}) => {
    return (
        <ImageListItem sx={{aspectRatio: "1 / 1"}}>
            <img 
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
    const [prodInternal,setProdInternal] = useState<string[]>([])
    const idb = useRef<IDB>(null)
    const initDB = async() => {
        idb.current = new IDB()
        await idb.current.initDB()
        try {
            const allSkuMapItems = await idb.current.getItems(StoreNames.SkuMapItems) as ISkuMapItem[]
            const skuMapItems = allSkuMapItems.filter(e => e.external === id)
            setProdInternal([...skuMapItems.map(e => e.internal)])
        } catch (e) {}
    }

    useEffect(()=>{
        initDB()
    },[])

    return (
        <TableCell>
            <ImageList cols={10}>
                {prodInternal.map(id => <Image key={id} {...{id}} />)}
            </ImageList>
        </TableCell>
    )
}

export default Images
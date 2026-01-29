import ImageList from '@mui/material/ImageList';
import ImageListItem from '@mui/material/ImageListItem';
import ImageListItemBar from '@mui/material/ImageListItemBar'
import { useContext, useEffect, useRef, useState } from 'react';
import { ProductIdContext } from '../contexts';
import { IDB } from 'src/hooks/class-db';
import { ISkuMapItem, StoreNames } from 'src/interfaces';
import Typography from '@mui/material/Typography';

const Image = ({id}:{id:string}) => (
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

const Images = () => {
    const {productID} = useContext(ProductIdContext)
    const idb = useRef<IDB>(null)
    const loading = useRef(true)
    const [internalIDS,setInternalIDs] = useState<string[]>([])
    const initDB = async() => {
        idb.current = new IDB()
        await idb.current.initDB()
        loading.current = false
        await loadImages()
    }
    const loadImages = async() => {
        if (loading.current) return
        loading.current = true

        try {
            const skuMapItems = await idb.current.getItems(StoreNames.SkuMapItems) as ISkuMapItem[]
            const thisSkuMapItems = skuMapItems.filter(e => e.external === productID)
            setInternalIDs([...thisSkuMapItems.map(e => e.internal)])
        } catch (e) {}

        loading.current = false
    }

    useEffect(()=>{
        initDB()
    },[])

    useEffect(()=>{
        loadImages()
    },[productID])

    return (
        <ImageList cols={2} sx={{my:0}}>
            {internalIDS.map(id => <Image key={id} {...{id}} />)}
        </ImageList>
    )
}

export default Images
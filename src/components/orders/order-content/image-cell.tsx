import ImageList from "@mui/material/ImageList"
import ImageListItem from "@mui/material/ImageListItem"
import ImageListItemBar from "@mui/material/ImageListItemBar"
import TableCell from "@mui/material/TableCell"
import Typography from "@mui/material/Typography"
import { useEffect, useRef, useState } from "react"
import { IDB } from "src/hooks/class-db"
import { ISkuMapItem, StoreNames } from "src/interfaces"

const ImageCell = ({id}:{id:string}) => {
    const idb = useRef<IDB>(null)
    const loading = useRef(true)
    const [internalIDs,setInternalIDs] = useState<string[]>([])
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
            const allSkuMapItems = await idb.current.getItems(StoreNames.SkuMapItems) as ISkuMapItem[]
            setInternalIDs(allSkuMapItems.filter(e => e.external === id).map(e => e.internal))
        } catch (e) {}

        loading.current = false
    }

    useEffect(()=>{
        initDB()
    },[])

    useEffect(()=>{
        loadImages()
    },[id])

    return (
        <TableCell>
            <ImageList cols={5}>
                {internalIDs.map(e => (
                    <ImageListItem key={e} sx={{aspectRatio: "1 / 1"}}>
                        <img 
                            src={`https://media-admin.fairymade.co/${e}.avif`}
                            loading='lazy'
                            width='100%'
                            style={{objectFit:'cover',objectPosition:'center',width:'100%',height:'100%'}}
                        />
                        <ImageListItemBar 
                            title={<Typography variant='body2'>{e}</Typography>} 
                            sx={{
                                '.MuiImageListItemBar-titleWrap':{
                                    py:0,textAlign:'center'
                                }
                            }}
                        />
                    </ImageListItem>
                ))}
            </ImageList>
        </TableCell>
    )
}

export default ImageCell
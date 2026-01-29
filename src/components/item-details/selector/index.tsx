import Grid from '@mui/material/Grid2'
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import { useContext, useEffect, useRef, useState } from 'react'
import { ProductIdContext } from '../contexts'
import Stack from '@mui/material/Stack';
import { IDB } from 'src/hooks/class-db';
import { StoreNames } from 'src/interfaces';
import Images from './images';
import Stock from './stock';

const Selector = () => {
    const {productID,updateProductID} = useContext(ProductIdContext)
    const [productIDs,setProductIDs] = useState<string[]>([])
    const idb = useRef<IDB>(null)
    const initDB = async() => {
        idb.current = new IDB()
        await idb.current.initDB()
        const _productIDs = await idb.current.getIDs(StoreNames.ProductsExternal) as string[]
        setProductIDs(_productIDs)
    }
    const skuOnChange = (_:any, v:string|string[]|null) => {
        if (typeof v === 'string' && !!v) updateProductID(v)
        else updateProductID(null)
    }

    useEffect(()=>{
        initDB()
    },[])

    return (
        <Grid size={3} sx={{height:'calc(100vh - 16px)',overflowY:'auto'}}>
            <Stack direction='column' rowGap={2}>
                <Autocomplete 
                    options={productIDs}
                    renderInput={(params) => <TextField {...params} label="SKU #" />}
                    sx={{mt:1}}
                    fullWidth
                    value={productID}
                    onChange={skuOnChange}
                />
                {!!productID && <>
                <Stock />
                <Images />
                </>}
            </Stack>
        </Grid>
    )
}

export default Selector
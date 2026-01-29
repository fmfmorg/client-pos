import Select, { SelectChangeEvent } from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import { useContext, useEffect, useId, useState } from 'react';
import { IDB } from 'src/hooks/class-db';
import { ISpecification, StoreNames } from 'src/interfaces';
import { ProductTypeContext } from '../contexts';

const ProductSubTypeFilter = () => {
    const id = useId()
    const {productSubTypes,updateProductSubTypes} = useContext(ProductTypeContext)
    const [productSubTypeOptions,setProductSubTypeOptions] = useState<ISpecification[]>([])
    const getProductTypes = async()=>{
        const idb = new IDB()
        await idb.initDB()
        const mainTypes = await idb.getItems(StoreNames.ProductSubTypes) as ISpecification[]
        setProductSubTypeOptions(mainTypes)
    }
    const onChange = (e:SelectChangeEvent<number[]>) => updateProductSubTypes(e.target.value as number[])
    
    useEffect(()=>{
        getProductTypes()
    },[])

    return (
        <FormControl fullWidth sx={{minWidth:'200px'}}>
            <InputLabel id={id}>Subtype</InputLabel>
            <Select
                labelId={id}
                label='Subtype'
                multiple
                value={productSubTypes}
                onChange={onChange}
            >
                {productSubTypeOptions.map(e => <MenuItem key={e.id} value={e.id}>{e.name}</MenuItem>)}
            </Select>
        </FormControl>
    )
}

export default ProductSubTypeFilter
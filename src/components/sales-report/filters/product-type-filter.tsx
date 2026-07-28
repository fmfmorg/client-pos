import Select, { SelectChangeEvent } from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import { useContext, useEffect, useId, useState } from 'react';
import { IDB } from '../../../hooks/class-db';
import { ISpecification, StoreNames } from '../../../interfaces';
import { ProductTypeContext } from '../contexts';

const ProductTypeFilter = () => {
    const id = useId()
    const {productTypes,updateProductTypes} = useContext(ProductTypeContext)
    const [productTypeOptions,setProductTypeOptions] = useState<ISpecification[]>([])
    const getProductTypes = async()=>{
        const idb = new IDB()
        await idb.initDB()
        const mainTypes = await idb.getItems(StoreNames.ProductMainTypes) as ISpecification[]
        setProductTypeOptions(mainTypes)
    }
    const onChange = (e:SelectChangeEvent<number[]>) => updateProductTypes(e.target.value as number[])
    
    useEffect(()=>{
        getProductTypes()
    },[])

    return (
        <FormControl fullWidth sx={{minWidth:'200px'}}>
            <InputLabel id={id}>Main Type</InputLabel>
            <Select
                labelId={id}
                label='Main Type'
                multiple
                value={productTypes}
                onChange={onChange}
            >
                {productTypeOptions.map(e => <MenuItem key={e.id} value={e.id}>{e.name}</MenuItem>)}
            </Select>
        </FormControl>
    )
}

export default ProductTypeFilter
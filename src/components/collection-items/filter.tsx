import DialogContent from "@mui/material/DialogContent"
import { useContext, useEffect, useRef, useState } from "react"
import { FilterContext, SubTypeContext } from "./contexts"
import Table from "@mui/material/Table"
import TableBody from "@mui/material/TableBody"
import TableRow from "@mui/material/TableRow"
import TableCell from "@mui/material/TableCell"
import Slider from "@mui/material/Slider"
import DialogActions from "@mui/material/DialogActions"
import FormGroup from "@mui/material/FormGroup"
import Button from "@mui/material/Button"
import { CustomEventKeys, dispatchNewEvent } from "@misc"
import { IDB } from "../../hooks/class-db"
import { IProductExternal, IProductInternal, ISkuMapItem, ISpecification, StoreNames } from "../../interfaces"
import FormControlLabel from "@mui/material/FormControlLabel"
import Checkbox from "@mui/material/Checkbox"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"

const Filter = () => {
    const {
        stars,
        updateStars,
        toggleFilter,
        colorOpts,
        colors,
        updateColors,
    } = useContext(FilterContext)
    const {subTypeIDs} = useContext(SubTypeContext)
    const [count,setCount] = useState(0)
    const idb = useRef<IDB>(null)
    const loading = useRef(true)
    const initDB = async() => {
        idb.current = new IDB()
        await idb.current.initDB()
        loading.current = false
        await updateItemCount()
    }
    const updateItemCount = async() => {
        if (loading.current) return

        loading.current = true

        try {
            const [allSkuMapItems,allProductsInternal,allProductsExternal] = await Promise.all([
                idb.current.getItems(StoreNames.SkuMapItems) as Promise<ISkuMapItem[]>,
                idb.current.getItems(StoreNames.ProductsInternal) as Promise<IProductInternal[]>,
                idb.current.getItems(StoreNames.ProductsExternal) as Promise<IProductExternal[]>,
            ])
            const productInternalIDs = allProductsInternal.filter(e => subTypeIDs.includes(e.productTypeID) && colorsTemp.includes(e.metalColorID)).map(e => e.id)
            const tempProductExternalIDs = allSkuMapItems.filter(e => productInternalIDs.includes(e.internal)).map(e => e.external)
            const minStar = Math.min(...starsTemp)
            const maxStar = Math.max(...starsTemp)
            const productsExternal = allProductsExternal.filter(e => tempProductExternalIDs.includes(e.id) && e.keepInCollection >= minStar && e.keepInCollection <= maxStar)
            setCount(productsExternal.length)
        } catch (e) {}

        loading.current = false
    }
    const [starsTemp,setStarsTemp] = useState<number[]>(stars)
    const starsOnChange = (_:any, v:number[]) => setStarsTemp(v.sort())
    const [colorsTemp,setColorsTemp] = useState<number[]>(colors)
    const updateColorsTemp = (v:number) => {
        if (colorsTemp.includes(v)) setColorsTemp(colorsTemp.filter(e => e !== v));
        else setColorsTemp([...colorsTemp,v])
    }
    const updateOnClick = () => {
        updateStars([...starsTemp])
        updateColors([...colorsTemp])
        setTimeout(() => dispatchNewEvent(CustomEventKeys.COLLECTION_ITEMS_UPDATE), 100);
    }

    useEffect(()=>{
        initDB()
    },[])

    useEffect(()=>{
        updateItemCount()
    },[starsTemp,colorsTemp,subTypeIDs])

    return (
        <>
        <DialogContent>
            <Table size='small'>
                <TableBody>
                    <TableRow>
                        <TableCell>Stars</TableCell>
                        <TableCell width={200}>
                            <Slider 
                                value={starsTemp}
                                onChange={starsOnChange}
                                valueLabelDisplay='auto'
                                min={0}
                                max={5}
                            />
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>Colors</TableCell>
                        <TableCell>
                            <FormGroup>
                                {colorOpts.map(id => (
                                    <ColorOption 
                                        key={id}
                                        id={id} 
                                        checked={colorsTemp.includes(id)} 
                                        updateColor={()=>updateColorsTemp(id)}
                                    />
                                ))}
                            </FormGroup>
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </DialogContent>
        <DialogActions sx={{justifyContent:'space-between'}}>
            <Stack direction='row'>
                <Typography>{count} items</Typography>
            </Stack>
            <Stack direction='row'>
                <Button variant='contained' onClick={updateOnClick}>Update</Button>
                <Button onClick={toggleFilter}>Cancel</Button>
            </Stack>
        </DialogActions>
        </>
    )
}

const ColorOption = (
    {
        id,
        checked,
        updateColor,
    }:{
        id:number;
        checked:boolean;
        updateColor:()=>void;
    }
) => {
    const idb = useRef<IDB>(null)
    const [name,setName] = useState('')
    const initDB = async() => {
        idb.current = new IDB()
        await idb.current.initDB()
        
        try {
            const item = await idb.current.getItem(id,StoreNames.MetalColors) as ISpecification
            setName(item.name)
        } catch (e) {} 
    }

    useEffect(()=>{
        initDB()
    },[])

    return (
        <FormControlLabel control={<Checkbox checked={checked} onChange={updateColor} sx={{py:0.5}} />} label={name} />
    )
}

export default Filter
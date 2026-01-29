'use client'

import Box from "@mui/material/Box"
import CategoryList from "./category-list"
import { useEffect, useRef, useState } from "react"
import { SubTypeContext, FilterContext } from "./contexts"
import AppBar from "@mui/material/AppBar"
import Toolbar from "@mui/material/Toolbar"
import ImageList from "@mui/material/ImageList"
import { IDB } from "src/hooks/class-db"
import { IProductExternal, IProductInternal, ISkuMapItem, StoreNames } from "src/interfaces"
import SingleItem from "./single-item"
import Backdrop from "@mui/material/Backdrop"
import CircularProgress from "@mui/material/CircularProgress"
import { CustomEventKeys, dispatchNewEvent } from "@misc"
import Button from "@mui/material/Button"
import Alerts from "src/misc/alerts"
import Stack from "@mui/material/Stack"
import Dialog from "@mui/material/Dialog"
import Filter from "./filter"
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import RefreshIcon from '@mui/icons-material/Refresh';

const CollectionItems = () => {
    const idb = useRef<IDB>(null)
    const [printing,setPrinting] = useState(false)
    const [subTypeIDs,setSubTypeIDs] = useState<number[]>([])
    const [columns,setColumns] = useState(5)
    const [singleIDs,setSingleIDs] = useState<string[]>([])
    const [setIDs,setSetIDs] = useState<string[]>([])
    const [filterOpen,setFilterOpen] = useState(false)
    const [stars,setStars] = useState<number[]>([1,5])
    const updateStars = (v:number[]) => setStars(v)
    const [colorOpts,setColorOpts] = useState<number[]>([])
    const [colors,setColors] = useState<number[]>([])
    const updateColors = (v:number[]) => setColors(v)
    const updateSubTypeIDs = (values:number[]) => {
        const temp = [...new Set([...subTypeIDs,...values])]
        const toDelete = values.filter(e => subTypeIDs.includes(e))
        const newArr = temp.filter(e => !toDelete.includes(e))
        setSubTypeIDs([...newArr])
    }
    const initDB = async() => {
        idb.current = new IDB()
        await idb.current.initDB()

        try {
            const metalColors = await idb.current.getIDs(StoreNames.MetalColors) as number[]
            setColorOpts(metalColors)
            setColors(metalColors)
        } catch (e) {}
    }
    const updateIDs = async() => {
        if (!subTypeIDs.length) {
            setSingleIDs([])
            setSetIDs([])
            setFilterOpen(false)
            return
        }

        try {
            const [tempAllSkuMapItems,allProductsInternal,allProductsExternal] = await Promise.all([
                idb.current.getItems(StoreNames.SkuMapItems) as Promise<ISkuMapItem[]>,
                idb.current.getItems(StoreNames.ProductsInternal) as Promise<IProductInternal[]>,
                idb.current.getItems(StoreNames.ProductsExternal) as Promise<IProductExternal[]>,
            ])
            const allSkuMapItems = [...tempAllSkuMapItems].sort((a,b)=>b.external > a.external ? 1 : -1)
            const internalIDs = allProductsInternal.filter(e => subTypeIDs.includes(e.productTypeID) && colors.includes(e.metalColorID)).sort((a,b)=>b.id > a.id ? 1 : -1).sort((a,b)=>a.productTypeID - b.productTypeID).map(e => e.id)

            const starMin = Math.min(...stars)
            const starMax = Math.max(...stars)
            const productExternalIDs = allProductsExternal.filter(e => e.keepInCollection >= starMin && e.keepInCollection <= starMax).map(e => e.id)
            
            const externalIDs = [...new Set(allSkuMapItems.filter(e => internalIDs.includes(e.internal) && productExternalIDs.includes(e.external)).sort((a,b)=>internalIDs.indexOf(a.internal) - internalIDs.indexOf(b.internal)).map(e => e.external))]
            const _setIDs = externalIDs.filter(e => allSkuMapItems.filter(d => d.external === e).length > 1)
            const _singleIDs = !!_setIDs.length ? externalIDs.filter(e => !_setIDs.includes(e)) : [...externalIDs]
            setSetIDs([..._setIDs])
            setSingleIDs([..._singleIDs])
        } catch (e) {}

        setFilterOpen(false)
    }
    const printingStart = () => setPrinting(true)
    const printingEnd = () => setPrinting(false)
    const onBulkUpdate = async() => {
        const allProductsExternal = await idb.current.getItems(StoreNames.ProductsExternal) as IProductExternal[]
        const productsToBeUpdated = allProductsExternal.filter(e => !!e.dbToBeUpdated)

        if (!productsToBeUpdated.length) return

        dispatchNewEvent(CustomEventKeys.PRINTING_START)

        try {
            const resp = await fetch('/api/pos/collection-item-bulk-update',{
                method:'POST',
                body:JSON.stringify({items:productsToBeUpdated.map(e => ({id:e.id,keepInCollection:e.keepInCollection}))})
            })

            if (resp.ok){
                await idb.current.updateItems(productsToBeUpdated.map(e => ({...e,dbToBeUpdated:false})),StoreNames.ProductsExternal)
                dispatchNewEvent(CustomEventKeys.PRODUCTS_UPDATE_SUCCESSFUL)
            } else {
                const text = await resp.text()
                console.log(text)
                dispatchNewEvent(CustomEventKeys.PRODUCTS_UPDATE_FAILED);
            }
        } catch (e) {
            console.log(e)
            dispatchNewEvent(CustomEventKeys.PRODUCTS_UPDATE_FAILED)
        }

        dispatchNewEvent(CustomEventKeys.PRINTING_END)
    }
    const onSlowUpdate = async() => {
        const allProductsExternal = await idb.current.getItems(StoreNames.ProductsExternal) as IProductExternal[]
        const productsToBeUpdated = allProductsExternal.filter(e => !!e.dbToBeUpdated)

        if (!productsToBeUpdated.length) return

        dispatchNewEvent(CustomEventKeys.PRINTING_START)

        for (const p of productsToBeUpdated){
            try {
                const resp = await fetch('/api/pos/collection-item-slow-update',{
                    method:'POST',
                    body:JSON.stringify({id:p.id,keepInCollection:p.keepInCollection})
                })
                
                if (resp.ok){
                    await idb.current.updateItem({...p,dbToBeUpdated:false},StoreNames.ProductsExternal)
                    console.log(`${p.id} updated`)
                } else {
                    dispatchNewEvent(CustomEventKeys.PRINTING_END)
                    dispatchNewEvent(CustomEventKeys.PRODUCTS_UPDATE_FAILED);
                    break
                }
            } catch (e) {
                dispatchNewEvent(CustomEventKeys.PRINTING_END)
                dispatchNewEvent(CustomEventKeys.PRODUCTS_UPDATE_FAILED);
                break
            }
        }
        dispatchNewEvent(CustomEventKeys.PRINTING_END)
        dispatchNewEvent(CustomEventKeys.PRODUCTS_UPDATE_SUCCESSFUL)
    }
    const toggleFilter = () => setFilterOpen(prev => !prev)

    useEffect(()=>{
        initDB()
        document.addEventListener(CustomEventKeys.PRINTING_START,printingStart)
        document.addEventListener(CustomEventKeys.PRINTING_END,printingEnd)
        
        document.title = 'Collection Items'

        return () => {
            document.removeEventListener(CustomEventKeys.PRINTING_START,printingStart)
            document.removeEventListener(CustomEventKeys.PRINTING_END,printingEnd)
        }
    },[])

    useEffect(()=>{
        document.addEventListener(CustomEventKeys.COLLECTION_ITEMS_UPDATE,updateIDs)
        return () => {
            document.removeEventListener(CustomEventKeys.COLLECTION_ITEMS_UPDATE,updateIDs)
        }
    },[subTypeIDs,stars,colors])

    return (
        <SubTypeContext value={{updateSubTypeIDs,subTypeIDs,columns}}>
            <Box sx={{ display: 'flex' }}>
                <CategoryList />
                <Box sx={{width:'100%'}}>
                    <AppBar>
                        <Toolbar />
                    </AppBar>
                    <Toolbar sx={theme => ({zIndex: theme.zIndex.drawer + 1, display:'flex',flexDirection:'row',justifyContent:'space-between'})}>
                        <Stack direction='row' columnGap={2} sx={{position:'fixed',top:12}}>
                            <Button color="secondary" variant="contained" sx={{fontWeight:'bold',letterSpacing:'0.05rem'}} onClick={toggleFilter} startIcon={<FilterAltIcon />}>Filter</Button>
                            <Button color="warning" variant="contained" sx={{fontWeight:'bold',letterSpacing:'0.05rem'}} onClick={updateIDs} startIcon={<RefreshIcon />}>Reload</Button>
                        </Stack>
                        <Stack direction='row' columnGap={2} sx={{position:'fixed',top:12,right:16}}>
                            <Button color="warning" variant="contained" sx={{fontWeight:'bold',letterSpacing:'0.05rem'}} onClick={onSlowUpdate}>Slow Update</Button>
                            <Button color="error" variant="contained" sx={{fontWeight:'bold',letterSpacing:'0.05rem'}} onClick={onBulkUpdate}>Bulk Update</Button>
                        </Stack>
                    </Toolbar>
                    <ImageList cols={columns} sx={{overflowY:'visible'}}>
                        {singleIDs.map(id => <SingleItem key={id} {...{id}} />)}
                    </ImageList>
                </Box>
                <Alerts />
            </Box>
            <Dialog open={filterOpen} onClose={toggleFilter}>
                <FilterContext value={{
                    stars,
                    updateStars,
                    toggleFilter,
                    colorOpts,
                    colors,
                    updateColors,
                }}>
                    <Filter />
                </FilterContext>
            </Dialog>
            <Backdrop 
                open={printing}
                sx={(theme) => ({ zIndex: theme.zIndex.drawer + 1 })}
            >
                <CircularProgress 
                    sx={{
                        color:'#fff',
                        scale:3,
                        strokeLinecap:'round',
                        'circle':{animation:'5s'},
                    }} 
                />
            </Backdrop>
        </SubTypeContext>
    )
}

export default CollectionItems
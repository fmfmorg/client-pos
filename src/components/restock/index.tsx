'use client'

import AppBar from "@mui/material/AppBar"
import Box from "@mui/material/Box"
import Toolbar from "@mui/material/Toolbar/Toolbar"
import ImageList from '@mui/material/ImageList';
import { useEffect, useRef, useState } from "react";
import { IDB } from "../../hooks/class-db";
import { CompleteOrderStoreNames, ICompleteOrderItem, ISkuMapItem, StoreNames } from "../../interfaces";
import RestockItem from "./item";

const Restock = () => {
    const idb = useRef<IDB>(null)
    const [externalIDs,setExternalIDs] = useState<string[]>([])
    const initDB = async() => {
        idb.current = new IDB()
        await idb.current.initDB()

        try {
            const [
                allOrderItems,
                allSkuMapItems,
            ] = await Promise.all([
                idb.current.getItems(CompleteOrderStoreNames.OrderItems) as Promise<ICompleteOrderItem[]>,
                idb.current.getItems(StoreNames.SkuMapItems) as Promise<ISkuMapItem[]>,
            ])
            const _externalIDs = [...new Set(allOrderItems.map(e => e.productID))].filter(e => allSkuMapItems.filter(d => d.external === e).length === 1).sort().reverse()
            setExternalIDs(_externalIDs)
        } catch (e) {}
    }

    useEffect(()=>{
        initDB()
    },[])

    return (
        <Box>
            <AppBar>
                <Toolbar />
            </AppBar>
            <Toolbar sx={theme => ({zIndex: theme.zIndex.drawer + 1, display:'flex',flexDirection:'row',justifyContent:'flex-end'})}></Toolbar>
            <ImageList cols={8}>
                {externalIDs.map(id => <RestockItem key={id} {...{id}} />)}
            </ImageList>
        </Box>
    )
}

export default Restock
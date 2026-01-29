import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import { useEffect, useRef, useState } from "react";
import { IDB } from "src/hooks/class-db";
import { StoreNames } from "src/interfaces";
import MainTypeItem from "./main-type";

const drawerWidth = 200;

const CategoryList = () => {
    const idb = useRef<IDB>(null)
    const [mainTypeIDs,setMainTypeIDs] = useState<number[]>([])
    const initDB = async() => {
        idb.current = new IDB()
        await idb.current.initDB()
        const _mainTypeIDs = await idb.current.getIDs(StoreNames.ProductMainTypes) as number[]
        setMainTypeIDs(_mainTypeIDs.sort())
    }

    useEffect(()=>{
        initDB()
    },[])

    return (
        <Drawer
            variant="permanent"
            sx={{
                width: drawerWidth,
                flexShrink: 0,
                [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
            }}
        >
            <List sx={{ overflowX: 'hidden' }}>
                {mainTypeIDs.map(id => <MainTypeItem key={id} {...{id}} />)}
            </List>
        </Drawer>
    )
}

export default CategoryList
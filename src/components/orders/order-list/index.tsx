import Drawer from "@mui/material/Drawer"
import DrawerTop from "./drawer-top";
import { useCallback, useState } from "react";
import { DateContext } from "../contexts";
import ListBody from "./list";

const drawerWidth = 300;

const OrderList = () => {
    const initDate = () => {
        const d = new Date()
        d.setHours(0,0,0,0)
        return d.valueOf()
    }
    const [date,setDate] = useState(initDate())
    const updateDate = useCallback((v:number) => {setDate(v)},[date])
    return (
        <Drawer
            variant="permanent"
            sx={{
                width: drawerWidth,
                flexShrink: 0,
                [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box', p:1 },
            }}
        >
            <DateContext value={{date,updateDate}}>
                <DrawerTop />
                <ListBody />
            </DateContext>
        </Drawer>
    )
}

export default OrderList
'use client'

import Box from "@mui/material/Box"
import OrderList from "./order-list"
import { useCallback, useEffect, useState } from "react"
import { OrderNumberContext } from "./contexts"
import ActionsDrawer from "./actions"
import OrderContent from "./order-content"

const Orders = () => {
    const [orderNumber,setOrderNumber] = useState('')
    const updateOrderNumber = useCallback((v:string)=>setOrderNumber(v),[orderNumber])
    
    useEffect(()=>{
        document.title = 'Orders'
    },[])
    
    return (
        <OrderNumberContext value={{orderNumber,updateOrderNumber}}>
            <Box sx={{ display: 'flex' }}>
                <OrderList />
                <OrderContent />
                <ActionsDrawer />
            </Box>
        </OrderNumberContext>
    )
}

export default Orders
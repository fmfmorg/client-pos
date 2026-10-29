'use client'

import Box from "@mui/material/Box"
import OrderList from "./order-list"
import { useCallback, useEffect, useRef, useState } from "react"
import { OrderNumberContext } from "./contexts"
import ActionsDrawer from "./actions"
import OrderContent from "./order-content"
import Alerts from "../../misc/alerts"
import { CustomEventKeys, dispatchNewEvent } from "@misc"
import { IWorkerMessage } from "./interface"

const Orders = () => {
    const updateOrderWorkerRef = useRef<Worker>(null)
    const uploadRefundWorkerRef = useRef<Worker>(null)
    const [orderNumber,setOrderNumber] = useState('')
    const updateOrderNumber = useCallback((v:string)=>setOrderNumber(v),[orderNumber])

    const onOrderUpdate = (e:CustomEvent<string>) => updateOrderWorkerRef.current.postMessage(e.detail)
    const onRefundSubmitted = () => uploadRefundWorkerRef.current.postMessage(null)
    
    useEffect(()=>{
        document.title = 'Orders'
        updateOrderWorkerRef.current = new Worker(new URL('./workers/update-order.ts', import.meta.url))
        uploadRefundWorkerRef.current = new Worker(new URL('./workers/upload-refund.ts', import.meta.url))

        updateOrderWorkerRef.current.onmessage = (e:MessageEvent<IWorkerMessage>) => dispatchNewEvent(CustomEventKeys.ORDER_UPDATE_REPORT,e.data)
        uploadRefundWorkerRef.current.onmessage = () => dispatchNewEvent(CustomEventKeys.REFUND_UPLOADED)

        document.addEventListener(CustomEventKeys.ORDER_TO_BE_UPDATED,onOrderUpdate)
        document.addEventListener(CustomEventKeys.REFUND_SUBMITED,onRefundSubmitted)

        return () => {
            document.removeEventListener(CustomEventKeys.ORDER_TO_BE_UPDATED,onOrderUpdate)

            updateOrderWorkerRef.current.terminate()
            uploadRefundWorkerRef.current.terminate()
        }
    },[])
    
    return (
        <>
        <OrderNumberContext value={{orderNumber,updateOrderNumber}}>
            <Box sx={{ display: 'flex' }}>
                <OrderList />
                <OrderContent />
                <ActionsDrawer />
            </Box>
        </OrderNumberContext>
        <Alerts />
        </>
    )
}

export default Orders
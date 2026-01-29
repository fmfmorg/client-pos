'use client'

import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Grid from '@mui/material/Grid2';
import { useEffect, useRef, useState } from 'react';
import { IDB } from 'src/hooks/class-db';
import Alerts from '../../misc/alerts';
import OrderList from './order-list';
import Context from '@components/contexts';
import EntryComponent from './entry';
import OrderDetails from './order-details';
import Summary from './summary';
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import { broadcastChannelName, CustomEventKeys } from '@misc';
import Stack from '@mui/material/Stack';
import UploadOrderButtons from './toolbar-btns/upload-orders';
import DownloadOrderButton from './toolbar-btns/download-orders';
import UpdateIdbDataButton from './toolbar-btns/update-db-data';
import UpdateProductsButton from './toolbar-btns/update-products';

const entryColumnWidth = 3

const CashIn = () => {
    const toolbarRef = useRef<HTMLDivElement>(null)
    const broadcastChannel = useRef<BroadcastChannel>(null)
    const [printing,setPrinting] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const [currentOrderID,setCurrentOrderID] = useState(0)
    const createNewOrder = async() => {
        const newOrderID = await idb.current.createOrder()
        setCurrentOrderID(newOrderID)
    }
    const orderIdOnUpdate = (v:number) => {
        if (v !== currentOrderID) setCurrentOrderID(v)
    }
    const idb = useRef<IDB>(null);
    const initDB = async () => {
        idb.current = new IDB(true)
        await idb.current.initDB()
        createNewOrder()
    }
    const resizeContainer = () => {
        const marginTop = document.body.getBoundingClientRect().top
        const toolbarHeight = toolbarRef.current.getBoundingClientRect().height
        containerRef.current.style.height = `calc(100vh - ${marginTop * 2 + toolbarHeight}px)`
    }
    const onNextOrder = async(e:CustomEvent<{orderToDelete:number}>) => {
        await createNewOrder()
        await idb.current.deleteOrder(e.detail.orderToDelete)
    }
    const onOrderComplete = () => broadcastChannel.current.postMessage(CustomEventKeys.ORDER_COMPLETE)

    const printingStart = () => setPrinting(true)
    const printingEnd = () => setPrinting(false)

    useEffect(()=>{
        broadcastChannel.current = new BroadcastChannel(broadcastChannelName)

        initDB()
        resizeContainer()
        document.addEventListener(CustomEventKeys.PRINTING_START,printingStart)
        document.addEventListener(CustomEventKeys.PRINTING_END,printingEnd)
        document.addEventListener(CustomEventKeys.NEXT_ORDER,onNextOrder)
        document.addEventListener(CustomEventKeys.ORDER_COMPLETE,onOrderComplete)
        document.addEventListener(CustomEventKeys.PRODUCTS_UPDATE_SUCCESSFUL,createNewOrder)

        document.title = 'Till'

        return () => {
            document.removeEventListener(CustomEventKeys.PRINTING_START,printingStart)
            document.removeEventListener(CustomEventKeys.PRINTING_END,printingEnd)
            document.removeEventListener(CustomEventKeys.NEXT_ORDER,onNextOrder)
            document.removeEventListener(CustomEventKeys.ORDER_COMPLETE,onOrderComplete)
            document.removeEventListener(CustomEventKeys.PRODUCTS_UPDATE_SUCCESSFUL,createNewOrder)
        }
    },[])

    return (
        <Context.Provider value={{currentOrderID,createNewOrder,orderIdOnUpdate}}>
            <Box sx={{ display: 'flex' }}>
                <OrderList />
                <Box sx={{width:'100%'}}>
                    <AppBar>
                        <Toolbar />
                    </AppBar>
                    <Toolbar ref={toolbarRef} sx={theme => ({zIndex: theme.zIndex.drawer + 1, display:'flex',flexDirection:'row',justifyContent:'flex-end'})}>
                        <Stack direction='row' columnGap={2}>
                            <UpdateProductsButton />
                            <UploadOrderButtons />
                            {/* <DownloadOrderButton /> */}
                            {/* <UpdateIdbDataButton /> */}
                        </Stack>
                    </Toolbar>
                    <Grid container direction='row' sx={{width:'100%'}} ref={containerRef}>
                        <Grid size={{sm:entryColumnWidth}} sx={{pr:1}}>
                            <EntryComponent />
                        </Grid>
                        <Grid size={{sm:10 - entryColumnWidth}} sx={{borderLeft:'1px solid #bbb', pl:1}}>
                            <OrderDetails />
                        </Grid>
                        <Grid size={{sm:2}} sx={{borderLeft:'1px solid #bbb', pl:1}}>
                            <Summary />
                        </Grid>
                    </Grid>
                </Box>
                <Alerts />
            </Box>
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
        </Context.Provider>
    )
}

export default CashIn
import Toolbar from '@mui/material/Toolbar';
import AddCircleRoundedIcon from '@mui/icons-material/AddCircleRounded';
import Button from '@mui/material/Button';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import { Ref, useContext, useEffect, useMemo, useRef, useState } from 'react';
import Context from '@components/contexts';
import { IDB } from '../../hooks/class-db';
import { CustomEventKeys } from '@misc';
import { useTheme } from '@mui/material';
import { StoreNames } from '../../interfaces';

const NewOrderButtonBar = ({ref}:{ref:Ref<HTMLDivElement>}) => {
    const {createNewOrder} = useContext(Context)
    return (
        <Toolbar ref={ref}>
            <Button
                variant='contained'
                startIcon={<AddCircleRoundedIcon />}
                fullWidth
                onClick={createNewOrder}
            >New Order</Button>
        </Toolbar>
    )
}

const OrderListItem = (
    {
        id,
        showDeleteBtn,
        deleteOrder,
    }:{
        id:number;
        showDeleteBtn:boolean;
        deleteOrder:()=>void;
    }
) => {
    const {palette:{grey}} = useTheme()
    const {orderIdOnUpdate,currentOrderID} = useContext(Context)
    const orderIdOnClick = () => orderIdOnUpdate(id)

    return (
        <ListItem sx={{py:0.5,...currentOrderID === id && {backgroundColor:grey[100]}}}>
            <ListItemButton sx={{flexGrow:1,pl:1,py:0,minHeight:40}} onClick={orderIdOnClick}>
                <ListItemText>{id}</ListItemText>
            </ListItemButton>
            {!!showDeleteBtn && <ListItemIcon sx={{minWidth:'fit-content'}}>
                <IconButton onClick={deleteOrder}><CancelRoundedIcon /></IconButton>
            </ListItemIcon>}
        </ListItem>
    )
}

const drawerWidth = 240;

const OrderList = () => {
    const idb = useRef<IDB>(null)
    const {currentOrderID,orderIdOnUpdate} = useContext(Context)
    const [orderIDs,setOrderIDs] = useState<number[]>([])
    const newOrderBarRef = useRef<HTMLDivElement>(null)
    const orderListRef = useRef<HTMLUListElement>(null)
    const resizeOrderList = () => {
        const {height} = newOrderBarRef.current.getBoundingClientRect()
        orderListRef.current.style.height = `calc(100vh - ${height}px)`
    }
    const orderListOnUpdate = async() => {
        const ids = await idb.current.getIDs(StoreNames.Orders) as number[]
        setOrderIDs([...ids.sort()])
    }
    const setupDbConn = async () => {
        idb.current = new IDB()
        await idb.current.initDB()
    }
    const showDeleteBtn = useMemo(()=>orderIDs.length > 1,[orderIDs.length > 1])
    const deleteOrder = (id:number) => {
        if (id === currentOrderID){
            const newOrderIDs = orderIDs.filter(e => e !== currentOrderID)
            const newLatestOrderID = newOrderIDs[newOrderIDs.length - 1]
            orderIdOnUpdate(newLatestOrderID)
        }
        idb.current.deleteOrder(id)
    }

    useEffect(()=>{
        setupDbConn()
        resizeOrderList()
        document.addEventListener(CustomEventKeys.ORDER_ID_LIST_UPDATED,orderListOnUpdate)
        return () => {
            document.removeEventListener(CustomEventKeys.ORDER_ID_LIST_UPDATED,orderListOnUpdate)
            
        }
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
            <NewOrderButtonBar ref={newOrderBarRef} />
            <List sx={{ overflowY: 'auto' }} ref={orderListRef}>
                {orderIDs.map(id=>(
                    <OrderListItem key={id} id={id} showDeleteBtn={showDeleteBtn} deleteOrder={()=>deleteOrder(id)} />
                ))}
            </List>
        </Drawer>
    )
}

export default OrderList
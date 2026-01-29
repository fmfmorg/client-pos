import Stack from "@mui/material/Stack"
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useContext, useEffect, useRef, useState } from "react";
import { IDB } from "src/hooks/class-db";
import dayjs, { Dayjs } from 'dayjs';
import { CompleteOrderStoreNames, ICompleteOrder } from "src/interfaces";
import { DateContext } from "../contexts";

const DateSelector = () => {
    const {date,updateDate} = useContext(DateContext)
    const [start,setStart] = useState(0)
    const idb = useRef<IDB>(null)
    const initDB = async() => {
        idb.current = new IDB()
        await idb.current.initDB()
        const orders = await idb.current.getItems(CompleteOrderStoreNames.Orders) as ICompleteOrder[]
        setStart(Math.min(...orders.map(e => e.dt)))
    }
    const onDateUpdate = (v:Dayjs) => {
        v.set('hour',0)
        v.set('minute',0)
        v.set('second',0)
        v.set('millisecond',0)
        updateDate(v.valueOf())
    }

    useEffect(()=>{
        initDB()
    },[])

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker 
                minDate={dayjs(start)}
                onChange={onDateUpdate}
                value={dayjs(date)}
            />
        </LocalizationProvider>
    )
}

const DrawerTop = () => (
    <Stack 
        direction='column' 
        spacing={2} 
        sx={(theme)=>({
            position:'sticky', 
            top:0, 
            left:0, 
            width:'100%', 
            backgroundColor:'#fff',
            zIndex: theme.zIndex.drawer + 1
        })}
    >
        <DateSelector />
    </Stack>
)

export default DrawerTop
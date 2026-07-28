import dayjs, { Dayjs } from 'dayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useContext, useEffect, useRef, useState } from 'react';
import { DateContext, UpdateDateContext } from './date-contexts';
import { IDB } from '../../hooks/class-db';
import { CompleteOrderStoreNames, ICompleteOrder } from '../../interfaces';

const MyDatePicker = ({isStart}:{isStart:boolean}) => {
    const idb = useRef<IDB>(null);
    const {start,end} = useContext(DateContext);
    const {updateDate} = useContext(UpdateDateContext)
    const [minDate,setMinDate] = useState(start)
    const [maxDate,setMaxDate] = useState(end)
    const initDB = async() => {
        idb.current = new IDB()
        await idb.current.initDB()
        const allOrders = await idb.current.getItems(CompleteOrderStoreNames.Orders) as ICompleteOrder[]
        const allDates = allOrders.map(e => e.dt)
        setMinDate(Math.min(...allDates))
        setMaxDate(Math.max(...allDates))
    }
    const onDateUpdate = (v:Dayjs) => {
        if (isStart) {
            v.set('hour',0)
            v.set('minute',0)
            v.set('second',0)
            v.set('millisecond',0)
        } else {
            v.set('hour',23)
            v.set('minute',59)
            v.set('second',59)
            v.set('millisecond',999)
        }
        updateDate(v.valueOf(),isStart)
    }

    useEffect(()=>{
        initDB()
    },[])

    return (
        <DatePicker 
            sx={{minWidth:'200px'}}
            label={isStart ? 'Start' : 'End'}
            value={isStart ? dayjs(start) : dayjs(end)}
            onChange={onDateUpdate}
            minDate={dayjs(isStart ? minDate : Math.max(minDate,start))}
            maxDate={dayjs(isStart ? Math.min(maxDate,end) : maxDate)}
        />
    )
}

export default MyDatePicker
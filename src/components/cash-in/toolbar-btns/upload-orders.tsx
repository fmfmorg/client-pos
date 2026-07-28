import Button from '@mui/material/Button';
import { useEffect, useRef } from 'react';
import { IDB } from '../../../hooks/class-db';

const UploadOrderButtons = () => {
    const idb = useRef<IDB>(null);
    const initDB = async () => {
        idb.current = new IDB()
        await idb.current.initDB()
    }
    const onClick = async () => await idb.current.uploadOrders()

    useEffect(()=>{
        initDB()
    },[])

    return (
        <Button color='secondary' variant='contained' sx={{fontWeight:'bold',letterSpacing:'0.05rem'}} onClick={onClick}>Upload Orders</Button>
    )
}

export default UploadOrderButtons
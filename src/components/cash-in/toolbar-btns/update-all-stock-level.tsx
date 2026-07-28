import Button from '@mui/material/Button';
import { useEffect, useRef } from 'react';
import { IDB } from '../../../hooks/class-db';
import { IProductExternal, StoreNames } from '../../../interfaces';
import { CustomEventKeys, dispatchNewEvent } from '@misc';

const UpdateAllStockLevel = () => {
    const idb = useRef<IDB>(null);
    const initDB = async () => {
        idb.current = new IDB()
        await idb.current.initDB()
    }
    const onClick = async() => {
        dispatchNewEvent(CustomEventKeys.NO_ORDER_TO_UPLOAD)
        const productsExternal = await idb.current.getItems(StoreNames.ProductsExternal) as IProductExternal[]

        for (const p of productsExternal){
            try {
                const resp = await fetch('/api/pos/upsert-stock-level',{
                    method:"POST",
                    body:JSON.stringify({
                        locationID:1,
                        itemID:p.id,
                        quantity:p.stock || 0,
                    })
                })

                if (resp.ok) {
                    p.stockLevelToBeUpdated = false
                    await idb.current.updateItem(p,StoreNames.ProductsExternal)
                }
                console.log (p.id + " done")
            } catch(e){
                console.log(p.id, e)
            }
        }
        dispatchNewEvent(CustomEventKeys.PRINTING_END)
    }

    useEffect(()=>{
        initDB()
    },[])

    return (
        <Button color='secondary' variant='contained' sx={{fontWeight:'bold',letterSpacing:'0.05rem'}} onClick={onClick}>Update All Stock Levels</Button>
    )
}

export default UpdateAllStockLevel
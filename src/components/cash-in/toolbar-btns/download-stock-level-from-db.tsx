import { useEffect, useRef } from "react";
import { IDB } from "../../../hooks/class-db";
import { CustomEventKeys, dispatchNewEvent } from "@misc";
import Button from "@mui/material/Button"
import { IProductExternal, StoreNames } from "../../../interfaces";

interface IStockLevelItem {
    productID:string;
    stockQty:number;
}

const DownloadStockLevelsFromDB = () => {
    const idb = useRef<IDB>(null);
    const initDB = async () => {
        idb.current = new IDB()
        await idb.current.initDB()
    }

    const onClick = async() => {
        dispatchNewEvent(CustomEventKeys.PRINTING_START)

        try {
            const resp = await fetch('/api/pos/download-stock-level-from-db')
            if (!resp.ok){
                const text = await resp.text()
                console.log(text)
                dispatchNewEvent(CustomEventKeys.PRINTING_END)
                return 
            }
            const {stockItems} = await resp.json() as {
                stockItems: IStockLevelItem[];
            }

            const productsExternal = await idb.current.getItems(StoreNames.ProductsExternal) as IProductExternal[]

            for (const item of stockItems){
                const {productID, stockQty} = item

                const i = productsExternal.findIndex(e => e.id === productID)
                if (i !== -1){
                    productsExternal[i].stock = stockQty
                    await idb.current.updateItem(productsExternal[i],StoreNames.ProductsExternal)
                    console.log(productID + " done")
                }
            }
        } catch (e) {
            console.log(e)
        }

        dispatchNewEvent(CustomEventKeys.PRINTING_END)
    }

    useEffect(()=>{
        initDB()
    },[])

    return (
        <Button color='error' variant='contained' sx={{fontWeight:'bold',letterSpacing:'0.05rem'}} onClick={onClick}>Download Stock Level From DB</Button>
    )
}

export default DownloadStockLevelsFromDB
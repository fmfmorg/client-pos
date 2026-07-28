import { IDB } from "../../../hooks/class-db";
import { IAlertMessage, IProductExternal, StoreNames } from "../../../interfaces";

let idb:IDB = null
let initialized = false

self.onmessage = async(e:MessageEvent<string>) => {
    if (!initialized) {
        idb = new IDB()
        await idb.initDB()
        initialized = true
    }
    const productID = e.data
    const product = await idb.getItem(productID,StoreNames.ProductsExternal) as IProductExternal
    let msg:IAlertMessage = null

    try {
        const resp = await fetch('/api/pos/upsert-stock-level',{
            method:"POST",
            body:JSON.stringify({
                locationID:1,
                itemID:productID,
                quantity:product.stock || 0,
            })
        })

        if (resp.ok) {
            product.stockLevelToBeUpdated = false
            await idb.updateItem(product,StoreNames.ProductsExternal)
            msg = {color:'success', message:productID + " updated"}
        } else {
            product.stockLevelToBeUpdated = true
            await idb.updateItem(product,StoreNames.ProductsExternal)
            msg = {color:'error', message:productID + " update failed"}
        }
    } catch (e) {
        product.stockLevelToBeUpdated = true
        await idb.updateItem(product,StoreNames.ProductsExternal)
        msg = {color:'error', message:productID + " update failed"}
    }
    self.postMessage(msg)
}

export {};
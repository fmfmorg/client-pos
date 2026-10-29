import { IDB } from "../../../hooks/class-db"
import { CompleteOrderStoreNames, ICompleteOrder } from "../../../interfaces"

let idb:IDB = null
let initialized = false

self.onmessage = async(e:MessageEvent<string>) => {
    if (!initialized) {
        idb = new IDB()
        await idb.initDB()
        initialized = true
    }

    const orderID = e.data

    const order = await idb.getItem(orderID,CompleteOrderStoreNames.Orders) as ICompleteOrder

    const resp = await fetch('/api/pos/upload-order',{method:'POST',body:JSON.stringify(order)})
    
    order.dbToBeUpdated = !resp.ok
    await idb.updateItem(order,CompleteOrderStoreNames.Orders)

    self.postMessage({
        str:orderID,
        success:resp.ok,
    })
}

export {};
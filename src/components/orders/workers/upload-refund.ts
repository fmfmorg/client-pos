import { IDB } from "../../../hooks/class-db"
import { CompleteOrderStoreNames, IRefundItem } from "../../../interfaces"

let idb:IDB = null
let initialized = false

self.onmessage = async() => {
    if (!initialized) {
        idb = new IDB()
        await idb.initDB()
        initialized = true
    }

    const allRefunds = await idb.getItems(CompleteOrderStoreNames.RefundItems) as IRefundItem[]
    const refundsToBeUploaded = allRefunds.filter(e => !e.uploaded)

    for (const refundItem of refundsToBeUploaded){
        const resp = await fetch('/api/pos/upload-refund',{method:'POST',body:JSON.stringify(refundItem)})
        await idb.updateItem({...refundItem,uploaded:resp.ok,dbToBeUpdated:false},CompleteOrderStoreNames.RefundItems)
    }

    self.postMessage(null)
}

export {};
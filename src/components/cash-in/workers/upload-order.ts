import { sleep } from "@misc";
import { IDB } from "../../../hooks/class-db";
import { CompleteOrderStoreNames, ICompleteOrder, ICompleteOrderDiscountItem, ICompleteOrderItem, IProductExternal, StoreNames } from "../../../interfaces";

/*
const sleep = (milliseconds:number) => new Promise(resolve=>setTimeout(resolve,milliseconds))

const launch = async() => {
    const idb = new IDB()
    await idb.initDB()

    while (true) {
        await sleep(5000)
        const productsExternal = await idb.getItems(StoreNames.ProductsExternal) as IProductExternal[]
        const productsFiltered = productsExternal.filter(e => !!e.stockLevelToBeUpdated)

        for (const p of productsFiltered){
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
                    await idb.updateItem(p,StoreNames.ProductsExternal)
                    self.postMessage(p.id + " done")
                }
            } catch(e){
                self.postMessage(p.id, e)
            }
        }
    }
}
*/

let idb:IDB = null
let initialized = false

self.onmessage = async(e:MessageEvent<string>) => {
    if (!initialized) {
        idb = new IDB()
        await idb.initDB()
        initialized = true
    }

    const orderID = e.data
    const [
        order,
        allOrderItems,
        allDiscountItems,
    ] = await Promise.all([
        idb.getItem(orderID,CompleteOrderStoreNames.Orders) as Promise<ICompleteOrder>,
        idb.getItems(CompleteOrderStoreNames.OrderItems) as Promise<ICompleteOrderItem[]>,
        idb.getItems(CompleteOrderStoreNames.OrderDiscountItems) as Promise<ICompleteOrderDiscountItem[]>,
    ])

    let orderToBeUploaded = true
    while (orderToBeUploaded){
        const resp = await fetch('/api/pos/upload-order',{method:'POST',body:JSON.stringify(order)})
        if (resp.ok) {
            order.uploaded = true
            order.dbToBeUpdated = false
            await idb.updateItem(order,CompleteOrderStoreNames.Orders)
            orderToBeUploaded = false
        } else await sleep(10000)
    }

    const orderItems = allOrderItems.filter(e => e.orderID === orderID)
    for (const orderItem of orderItems){
        const resp = await fetch('/api/pos/upload-order-item',{method:'POST',body:JSON.stringify(orderItem)})
        if (resp.ok){
            orderItem.uploaded = true
            await idb.updateItem(orderItem,CompleteOrderStoreNames.OrderItems)
        }
    }

    const discountItems = allDiscountItems.filter(e => e.orderID === orderID)
    if (!!discountItems.length){
        for (const discountItem of discountItems){
            const resp = await fetch('/api/pos/upload-order-discount-item',{method:'POST',body:JSON.stringify(discountItem)})
            if (resp.ok){
                discountItem.uploaded = true
                await idb.updateItem(discountItem,CompleteOrderStoreNames.OrderDiscountItems)
            }
        }
    }

    self.postMessage(orderID)
}

export {};
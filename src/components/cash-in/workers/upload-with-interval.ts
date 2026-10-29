import { IDB } from "../../../hooks/class-db"
import { CompleteOrderStoreNames, ICompleteOrder, ICompleteOrderDiscountItem, ICompleteOrderItem, IRefundItem } from "../../../interfaces"

let idb:IDB = null
let initialized = false

self.onmessage = async() => {
    if (!initialized) {
        idb = new IDB()
        await idb.initDB()
        initialized = true
    }

    const [
        allOrders,
        allOrderItems,
        allDiscountItems,
        allRefundItems
    ] = await Promise.all([
        idb.getItems(CompleteOrderStoreNames.Orders) as Promise<ICompleteOrder[]>,
        idb.getItems(CompleteOrderStoreNames.OrderItems) as Promise<ICompleteOrderItem[]>,
        idb.getItems(CompleteOrderStoreNames.OrderDiscountItems) as Promise<ICompleteOrderDiscountItem[]>,
        idb.getItems(CompleteOrderStoreNames.RefundItems) as Promise<IRefundItem[]>,
    ])

    const orders = allOrders.filter(e => !e.uploaded || !!e.dbToBeUpdated)

    const orderItems = allOrderItems.filter(e => !e.uploaded)

    const discountItems = allDiscountItems.filter(e => !e.uploaded)

    const refundItems = allRefundItems.filter(e => !e.uploaded)

    let uploaded = false

    for (const order of orders){
        const resp = await fetch('/api/pos/upload-order',{method:'POST',body:JSON.stringify(order)})
        order.dbToBeUpdated = !resp.ok
        order.uploaded = resp.ok
        await idb.updateItem(order,CompleteOrderStoreNames.Orders)
        if (!uploaded && resp.ok) uploaded = true
        if (!resp.ok) console.log('order upload failed')
    }

    for (const orderItem of orderItems){
        const resp = await fetch('/api/pos/upload-order-item',{method:'POST',body:JSON.stringify(orderItem)})
        orderItem.uploaded = resp.ok
        await idb.updateItem(orderItem,CompleteOrderStoreNames.OrderItems)
        if (!uploaded && resp.ok) uploaded = true
        if (!resp.ok) console.log('order item upload failed')
    } 

    for (const discountItem of discountItems){
        const resp = await fetch('/api/pos/upload-order-discount-item',{method:'POST',body:JSON.stringify(discountItem)})
        discountItem.uploaded = resp.ok
        await idb.updateItem(discountItem,CompleteOrderStoreNames.OrderDiscountItems)
        if (!uploaded && resp.ok) uploaded = true
        if (!resp.ok) console.log('order discount upload failed')
    }

    for (const refundItem of refundItems){
        const resp = await fetch('/api/pos/upload-refund',{method:'POST',body:JSON.stringify(refundItem)})
        await idb.updateItem({...refundItem,uploaded:resp.ok,dbToBeUpdated:false},CompleteOrderStoreNames.RefundItems)
        if (!uploaded && resp.ok) uploaded = true
        if (!resp.ok) console.log('refund upload failed')
    }

    self.postMessage(uploaded)
}

export {};
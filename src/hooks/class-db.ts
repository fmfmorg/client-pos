import { chargeVAT, CustomEventKeys, dispatchNewEvent, ElementID, vatRate } from "@misc";
import { 
    IOrder, 
    IOrderDiscountItem, 
    IOrderItem, 
    IProductExternal, 
    IProductInternal, 
    IProductTypeMapItem, 
    ISkuMapItem, 
    ISpecification, 
    StoreNames,
    CompleteOrderStoreNames,
    ICompleteOrder,
    ICompleteOrderItem,
    ICompleteOrderDiscountItem,
    IRefundItem,
} from "../interfaces";
import { BuyXForY, ManualDiscountFixedAmount, ManualDiscountPercentage, nameBuyXForY } from "../misc/discounts";
import { OrderStatusEnum } from "../misc/order-status";

type IStockMapObjItem = IProductExternal & {receivedQuantity:number;}

export class IDB {
    clearDbOnInit:boolean;
    dbName: string;
    db: IDBDatabase;
    prevDtKey: string;
    orderProductIndexName: string;
    orderIndexName: string;
    storeNames: StoreNames[];
    completeOrderStoreNames: CompleteOrderStoreNames[];
    shopCode:string;

    constructor(clearDbOnInit = false){
        this.dbName = 'db'
        this.db = null
        this.prevDtKey = 'prevProductUpdateDT'
        this.orderProductIndexName = 'orderProductIndex'
        this.orderIndexName = 'orderIndex'
        this.clearDbOnInit = clearDbOnInit
        this.storeNames = Object.values(StoreNames)
        this.completeOrderStoreNames = Object.values(CompleteOrderStoreNames);
        this.shopCode = process.env.NEXT_PUBLIC_SHOP_CODE;
    }

    getCurrentVersion = async():Promise<number> => new Promise((resolve,reject)=>{
        const request = indexedDB.open(this.dbName);
        request.onsuccess = e => {
            const db = (e.target as IDBOpenDBRequest).result
            const version = db.version
            db.close()
            resolve(version)
        }
        request.onerror = e => reject((e.target as IDBOpenDBRequest).error);
    })

    checkAllStoreExists = async():Promise<boolean> => new Promise((resolve,reject)=>{
        const request = indexedDB.open(this.dbName);
        request.onsuccess = e => {
            const db = (e.target as IDBOpenDBRequest).result
            let allExists = true

            const allStoreNames = [...this.storeNames,...this.completeOrderStoreNames]

            for (const storeName of allStoreNames){
                allExists = db.objectStoreNames.contains(storeName)
                if (!allExists) break;
            }

            db.close()
            resolve(allExists)
        }
        request.onerror = e => reject((e.target as IDBOpenDBRequest).error);
    })

    openDB = ():Promise<IDBDatabase> => new Promise((resolve,reject)=>{
        if (typeof window === "undefined") return reject("IndexedDB is not available");

        const request = indexedDB.open(this.dbName);

        request.onsuccess = e => resolve((e.target as IDBOpenDBRequest).result);
        request.onerror = e => reject((e.target as IDBOpenDBRequest).error);

        request.onupgradeneeded = e => {
            const db = (e.target as IDBOpenDBRequest).result

            for (const storeName of this.storeNames) {
                db.createObjectStore(storeName,{keyPath:'id',autoIncrement:[StoreNames.OrderItems,StoreNames.OrderDiscountItems].includes(storeName)})
            }

            for (const storename of this.completeOrderStoreNames){
                db.createObjectStore(storename,{keyPath:'id',autoIncrement:storename !== CompleteOrderStoreNames.Orders})
            }
        }
    })

    clearStore = (storeName:string) => new Promise((resolve,reject)=>{
        const tx = this.db.transaction(storeName,'readwrite')
        const store = tx.objectStore(storeName)
        const req = store.clear()

        req.onsuccess = () => resolve(undefined)
        req.onerror = e => reject((e.target as IDBRequest).error)
    })

    clearOrderStores = () => Promise.all([StoreNames.OrderDiscountItems,StoreNames.OrderItems,StoreNames.Orders].map(e => this.clearStore(e)))

    initDB = async () => {
        // if (this.clearDbOnInit){
        //     // check current indexeddb version
        //     const version = await this.getCurrentVersion()

        //     // check if all object stores are created
        //     const allStoreExists = await this.checkAllStoreExists()
        // }

        this.db = await this.openDB()

        if (this.clearDbOnInit){
            await this.clearOrderStores();
            // const checkDbUpdated = this.checkDbUpdated()
            // if (checkDbUpdated) await this.clearOrderStores();
            // else {
            //     await Promise.all(this.storeNames.map(e => this.clearStore(e)))
            //     await this.updateDB()
            // }
        }
    }

    getDateStringInNum = (n:number) => {
        const d = new Date(n)
        return d.getFullYear() * 10000 + d.getMonth() * 100 + d.getDate()
    }

    checkDbUpdated = () => {
        const prevUpdateDtStr = localStorage.getItem(this.prevDtKey)
        if (!prevUpdateDtStr) return false

        const prevUpdateDtNum = +prevUpdateDtStr
        if (isNaN(prevUpdateDtNum)) return false

        return this.getDateStringInNum(Date.now()) === this.getDateStringInNum(prevUpdateDtNum)
    }

    updateDB = async () => {
        dispatchNewEvent(CustomEventKeys.PRINTING_START)

        try {
            const resp = await fetch('/api/pos/day-start-fetch')

            if (!resp.ok) {
                const text = await resp.text()
                console.log(text)
                dispatchNewEvent(CustomEventKeys.PRODUCTS_UPDATE_FAILED)
                dispatchNewEvent(CustomEventKeys.PRINTING_END)
                return false
            }

            // if no update for stock
            /*
            const object = await resp.json() as {
                [StoreNames.ProductsExternal]:IProductExternal[];
                [StoreNames.ProductsInternal]:IProductInternal[];
                [StoreNames.MetalColors]:ISpecification[];
                [StoreNames.ProductMainTypes]:ISpecification[];
                [StoreNames.ProductSubTypes]:ISpecification[];
                [StoreNames.ProductTypeMapItems]:IProductTypeMapItem[];
                [StoreNames.SkuMapItems]:ISkuMapItem[];
                [StoreNames.PaymentMethods]:ISpecification[];
            }
            */

            // calculate display and stock quantity
            const [
                allSkuMapItems,
                allProductsInternal,
                allProductsExternal
            ] = await Promise.all([
                this.getItems(StoreNames.SkuMapItems) as Promise<ISkuMapItem[]>,
                this.getItems(StoreNames.ProductsInternal) as Promise<IProductInternal[]>,
                this.getItems(StoreNames.ProductsExternal) as Promise<IProductExternal[]>,
            ])

            const mapObjItems = allProductsExternal.map(e => e.id).map(id => {
                const internalIDs = allSkuMapItems.filter(e => e.external === id).map(e => e.internal)
                const productInternals = allProductsInternal.filter(e => internalIDs.includes(e.id))
                const qtyReceived = Math.min(...productInternals.map(e => e.receivedQuantity))

                const productExternal = allProductsExternal.find(e => e.id === id)
                const {stock} = productExternal

                return {[id]:{...productExternal, stock:stock || 0, receivedQuantity:qtyReceived}}
            }).reduce((a,b)=>({...a,...b}),{})

            const mapObj = new Map<string,IStockMapObjItem>(Object.entries(mapObjItems))
            
            const object = await resp.json() as {
                [StoreNames.ProductsExternal]:IProductExternal[];
                [StoreNames.ProductsInternal]:IProductInternal[];
                [StoreNames.MetalColors]:ISpecification[];
                [StoreNames.ProductMainTypes]:ISpecification[];
                [StoreNames.ProductSubTypes]:ISpecification[];
                [StoreNames.ProductTypeMapItems]:IProductTypeMapItem[];
                [StoreNames.SkuMapItems]:ISkuMapItem[];
                [StoreNames.PaymentMethods]:ISpecification[];
            }

            const {productsExternal,productsInternal,skuMapItems} = object

            let pExternalNew:IProductExternal[] = []

            for (const p of productsExternal) {
                const pExists = mapObj.has(p.id)

                const internalIDs = skuMapItems.filter(e => e.external === p.id).map(e => e.internal)
                const qtyReceived = Math.min(...productsInternal.filter(e => internalIDs.includes(e.id)).map(e => e.receivedQuantity))

                if (pExists) {
                    const pObj = mapObj.get(p.id)
                    const newStockLevel = pObj.stock + qtyReceived - pObj.receivedQuantity
                    if (p.stock !== newStockLevel) {
                        p.stock = newStockLevel
                        p.stockLevelToBeUpdated = true
                    }
                    pExternalNew.push(p)
                } else {
                    pExternalNew.push({...p,stock:qtyReceived,stockLevelToBeUpdated:true})
                }
            }

            object[StoreNames.ProductsExternal] = [...pExternalNew]
            // end of updating stock

            // clear existing database
            await Promise.all(this.storeNames.map(e => this.clearStore(e)))

            const entries = Object.entries(object)

            await Promise.all(entries.map(([k,v])=>new Promise((resolve,reject)=>{
                const tx = this.db.transaction(k,'readwrite')
                const store = tx.objectStore(k)

                const promises = v.map(item => new Promise((res,rej)=>{
                    const req = store.add(item)

                    req.onsuccess = () => res(null)
                    req.onerror = e => rej((e.target as IDBRequest).error)
                }))

                Promise.all(promises).then(()=>tx.oncomplete = () => resolve(null)).catch(err => reject(err))
            })))

            localStorage.setItem(this.prevDtKey, Date.now().toString())
            dispatchNewEvent(CustomEventKeys.PRODUCTS_UPDATE_SUCCESSFUL)
            dispatchNewEvent(CustomEventKeys.PRINTING_END)

            return true
        } catch (e) {
            dispatchNewEvent(CustomEventKeys.PRODUCTS_UPDATE_FAILED)
            dispatchNewEvent(CustomEventKeys.PRINTING_END)
            return false
        }
    }

    createItem = (item:any,storeName:string) => new Promise((resolve,reject)=>{
        const tx = this.db.transaction(storeName,'readwrite')
        const store = tx.objectStore(storeName)

        const req = store.add(item)

        req.onsuccess = () => resolve(null)
        req.onerror = e => reject((e.target as IDBRequest).error)
    })

    createOrder = async () => {
        const id = Math.round(Date.now() * 0.001)

        await this.createItem({id,status:OrderStatusEnum.EDITING},StoreNames.Orders)
        dispatchNewEvent(CustomEventKeys.ORDER_ID_LIST_UPDATED)

        return id
    }

    updateItem = (item:any,storeName:string) => new Promise((resolve,reject)=>{
        const tx = this.db.transaction(storeName,'readwrite')
        const store = tx.objectStore(storeName)

        const req = store.put(item)

        req.onsuccess = () => resolve(null)
        req.onerror = e => reject((e.target as IDBRequest).error)
    })

    updateItems = (items:any[],storeName:string) => new Promise((resolve,reject)=>{
        const tx = this.db.transaction(storeName,'readwrite')
        const store = tx.objectStore(storeName)

        const promises = items.map(item => new Promise((res,rej)=>{
            const req = store.put(item)

            req.onsuccess = () => res(null)
            req.onerror = e => rej((e.target as IDBRequest).error)
        }))

        Promise.all(promises).then(()=>tx.oncomplete = () => resolve(null)).catch(err => reject(err))
    })

    updateOrderStatus = async(orderID:number,status:number) => {
        try {
            await this.updateItem({id:orderID,status,completeOrderNumber:''}, StoreNames.Orders)
            dispatchNewEvent(CustomEventKeys.ORDER_STATUS_UPDATED)
        } catch (e) {}
    }

    getItem = (id:number|string,storeName:string) => new Promise<any>((resolve,reject)=>{
        const tx = this.db.transaction(storeName,'readonly')
        const store = tx.objectStore(storeName)

        const req = store.get(id)

        req.onsuccess = e => resolve((e.target as IDBRequest<any>).result)
        req.onerror = e => reject((e.target as IDBRequest<any>).error)
    })

    getIDs = (storeName:string) => new Promise<number[]|string[]>((resolve,reject)=>{
        const tx = this.db.transaction(storeName,'readonly')
        const store = tx.objectStore(storeName)

        const req = store.getAllKeys()

        req.onsuccess = e => resolve((e.target as IDBRequest<number[]|string[]>).result)
        req.onerror = e => reject((e.target as IDBRequest<number[]|string[]>).error)
    })

    getItems = (storeName:string) => new Promise<any[]>((resolve,reject)=>{
        const tx = this.db.transaction(storeName,'readonly')
        const store = tx.objectStore(storeName)

        const req = store.getAll()

        req.onsuccess = e => resolve((e.target as IDBRequest<any[]>).result)
        req.onerror = e => reject((e.target as IDBRequest<any[]>).error)
    })

    deleteOrder = (id:number) => new Promise((_,reject)=>{
        const tx = this.db.transaction(StoreNames.Orders,'readwrite')
        const store = tx.objectStore(StoreNames.Orders)

        const req = store.delete(id)

        req.onsuccess = () => {
            dispatchNewEvent(CustomEventKeys.ORDER_ID_LIST_UPDATED)
        }
        req.onerror = e => reject((e.target as IDBRequest).error)
    })

    createItems = (items:any[],storeName:string) => new Promise((resolve,reject)=>{
        const tx = this.db.transaction(storeName,'readwrite')
        const store = tx.objectStore(storeName)

        const promises = items.map(item => new Promise((res,rej)=>{
            const req = store.add(item)

            req.onsuccess = () => res(null)
            req.onerror = e => rej((e.target as IDBRequest).error)
        }))

        Promise.all(promises).then(()=>tx.oncomplete = () => resolve(null)).catch(err => reject(err))
    })

    newOrderItemEntry = async(orderID:number,productID:string,qty:number) => {
        try {
            const product = await this.getItem(productID, StoreNames.ProductsExternal) as IProductExternal
            if (!product) return
        } catch (e) {
            return
        }

        const allOrderItems = await this.getItems(StoreNames.OrderItems) as IOrderItem[]
        const thisOrderItems = allOrderItems.filter(e => e.orderID === orderID)

        if (!thisOrderItems.length) {
            await this.createItem({
                orderID,
                productID,
                qty,
                dt:Date.now()
            },StoreNames.OrderItems)
        } else {
            thisOrderItems.sort((a,b)=>b.dt - a.dt)
            const latestItem = thisOrderItems[0]

            if (latestItem.productID === productID){
                latestItem.qty += qty
                await this.updateItem(latestItem, StoreNames.OrderItems)
            } else {
                await this.createItem({
                    orderID,
                    productID,
                    qty,
                    dt:Date.now()
                },StoreNames.OrderItems)
            }
        }
        
        await this.orderItemsOnEdit(orderID)
        dispatchNewEvent(CustomEventKeys.ORDER_ITEM_NEW_ADDED)
    }

    ////////////////////////////////

    orderItemQuantityOnEdit = async(id:number,qty:number) => {
        const orderItem = await this.getItem(id, StoreNames.OrderItems) as IOrderItem
        orderItem.qty = qty
        await this.updateItem(orderItem, StoreNames.OrderItems)
        await this.orderItemsOnEdit(orderItem.orderID)
    }

    getOrderItemCount = async(orderID:number) => {
        try {
            const allOrderItems = await this.getItems(StoreNames.OrderItems) as IOrderItem[]
            if (!allOrderItems.length) return 0
            const thisOrderItems = allOrderItems.filter(e => e.orderID === orderID && !!e.qty) 
            if (!thisOrderItems.length) return 0
            return thisOrderItems.map(e => e.qty).reduce((a,b)=>a+b,0)
        } catch(e) {
            return 0
        }
    }

    getOrderSubtotal = async(orderID:number) => {
        try {
            const allOrderItems = await this.getItems(StoreNames.OrderItems) as IOrderItem[]
            if (!allOrderItems.length) return 0
            const thisOrderItems = allOrderItems.filter(e => e.orderID === orderID && !!e.qty) 
            if (!thisOrderItems.length) return 0
            const productIDs = [...new Set(thisOrderItems.map(e => e.productID))]
            const products = await this.getItems(StoreNames.ProductsExternal) as IProductExternal[]
            const priceObj = products
                .filter(e => productIDs.includes(e.id))
                .map(({id,price,discount})=>({[id]:price - discount}))
                .reduce((a,b)=>({...a,...b}),{})
            const stt = thisOrderItems.map(e => priceObj[e.productID] * e.qty).reduce((a,b)=>a+b,0)
            return stt
        } catch (e) {
            return 0
        }
    }

    orderItemsOnEdit = async(orderID:number) => {
        let subtotal = await this.getOrderSubtotal(orderID)
        const allOrderDiscounts = await this.getItems(StoreNames.OrderDiscountItems) as IOrderDiscountItem[]
        const thisOrderDiscounts = !!allOrderDiscounts.length ? [...allOrderDiscounts.filter(e => e.orderID === orderID)] : [];

        const allOrderItems = await this.getItems(StoreNames.OrderItems) as IOrderItem[]
        const thisOrderItems = !!allOrderItems.length ? allOrderItems.filter(e => e.orderID === orderID && !!e.qty) : []
        const orderQuantity = !!thisOrderItems.length ? thisOrderItems.map(e=>e.qty).reduce((a,b)=>a+b,0) : 0
        const thisOrderProductIDs = !!orderQuantity ? [...new Set(thisOrderItems.map(e => e.productID))] : []

        const allProducts = await this.getItems(StoreNames.ProductsExternal) as IProductExternal[]
        const thisOrderProducts = !!orderQuantity ? allProducts.filter(e => thisOrderProductIDs.includes(e.id)) : []
        const priceObj = !!orderQuantity
            ? thisOrderProducts
                .filter(e => thisOrderProductIDs.includes(e.id))
                .map(({id,price,discount})=>({[id]:price - discount}))
                .reduce((a,b)=>({...a,...b}),{})
            : {}
        
        // buy X for £Y
        /*
        let buyXForY = 0

        if (orderQuantity >= BuyXForY.QUANTITY_X) {
            const priceItems = thisOrderItems.map(e => Array(e.qty).fill(priceObj[e.productID]) as number[]).flat().sort((a,b)=>b-a)
            const count = priceItems.length

            let discounts:number[] = []

            for (let i=0; i<count; i+=BuyXForY.QUANTITY_X){
                let originalSetPrice = 0
                let isSet = true
                for (let j=0; j<BuyXForY.QUANTITY_X; j++){
                    if (i+j === count) {
                        isSet = false
                        break
                    }
                    originalSetPrice += priceItems[i+j]
                }
                if (isSet && originalSetPrice > BuyXForY.SET_PRICE_Y) discounts.push(originalSetPrice - BuyXForY.SET_PRICE_Y)
                else break
            }
            if (!!discounts.length) buyXForY = discounts.reduce((a,b)=>a+b,0)
        }
        const buyXForYDiscountItem = thisOrderDiscounts.find(e => e.orderID === orderID && e.orderInReceipt === BuyXForY.ORDER_IN_RECEIPT)
        
        if (!!buyXForYDiscountItem) {
            buyXForYDiscountItem.amount = buyXForY
            await this.updateItem(buyXForYDiscountItem, StoreNames.OrderDiscountItems)
        } else {
            await this.createItem({
                name:nameBuyXForY,
                orderID,
                amount:buyXForY,
                orderInReceipt:BuyXForY.ORDER_IN_RECEIPT as number,
                values:[],
            },StoreNames.OrderDiscountItems)
        }

        if (!!buyXForY) subtotal -= buyXForY
        */

        // Manual Discount by Percentage
        const manualPctDiscountItem = thisOrderDiscounts.find(e => e.orderID === orderID && e.orderInReceipt === ManualDiscountPercentage.ORDER_IN_RECEIPT)
        if (!!manualPctDiscountItem){
            const discountPercentage = manualPctDiscountItem.values[0] as number
            const discountDecimal = discountPercentage * 0.01
            const discountAmount = Math.round(subtotal * discountDecimal)
            manualPctDiscountItem.amount = discountAmount

            await this.updateItem(manualPctDiscountItem, StoreNames.OrderDiscountItems)

            subtotal -= discountAmount
        }

        // Manual Discount by Fixed Amount
        const manualFixedAmtDiscountItem = thisOrderDiscounts.find(e => e.orderID === orderID && e.orderInReceipt === ManualDiscountFixedAmount.ORDER_IN_RECEIPT)
        if (!!manualFixedAmtDiscountItem){
            const tempAmount = manualFixedAmtDiscountItem.values[0] as number
            const finalAmount = Math.min(subtotal,tempAmount)
            manualFixedAmtDiscountItem.amount = finalAmount

            await this.updateItem(manualFixedAmtDiscountItem, StoreNames.OrderDiscountItems)

            subtotal -= finalAmount
        }

        dispatchNewEvent(CustomEventKeys.ORDER_ITEM_LIST_UPDATED)
    }

    getCompleteOrderDateString = () => {
        const date = new Date()
        const dateFormat = new Intl.DateTimeFormat('en-GB',{year:'2-digit',month:'2-digit',day:'2-digit'})
        const parts = dateFormat.formatToParts(date).filter(e => e.type !== 'literal').map(e => ({[e.type]:e.value})).reduce((a,b)=>({...a,...b}))
        return parts.year + parts.month + parts.day
    }

    getCompleteOrderNumber = async() => {
        const orderNumberPrefix = this.shopCode + '-' + this.getCompleteOrderDateString() + '-'
        const allOrderNumbers = await this.getIDs(CompleteOrderStoreNames.Orders) as string[]

        /////////////////////// day order number start ////////////////
        let orderNumber = 1

        if (!!allOrderNumbers.length){
            const todayOrderNumbers = allOrderNumbers.filter(e => e.startsWith(orderNumberPrefix))
            if (!!todayOrderNumbers.length){
                todayOrderNumbers.sort().reverse()
                const lastOrderNumberString = todayOrderNumbers[0]
                const lastOrderNumberParts = lastOrderNumberString.split('-')
                orderNumber = +lastOrderNumberParts[lastOrderNumberParts.length - 1] + 1
            }
        }

        return orderNumberPrefix + `${orderNumber}`.padStart(4,'0')
    }

    saveCompleteOrder = async(orderID:number,completeOrderNumber:string) => {
        const tempOrder = await this.getItem(orderID,StoreNames.Orders) as IOrder
        tempOrder.completeOrderNumber = completeOrderNumber
        tempOrder.status = OrderStatusEnum.SUBMITTED
        await this.updateItem(tempOrder, StoreNames.Orders)
    }

    saveCompleteOrderItems = async(orderID:number,completeOrderNumber:string) => {
        const orderItems = await this.getItems(StoreNames.OrderItems) as IOrderItem[]
        const thisOrderItems = orderItems.filter(e => e.orderID === orderID && !!e.qty)
        const thisOrderProductIDs = [...new Set(thisOrderItems.map(e => e.productID))]

        const allProducts = await this.getItems(StoreNames.ProductsExternal) as IProductExternal[]
        const thisOrderProducts = allProducts.filter(e => thisOrderProductIDs.includes(e.id))

        const completeOrderItems:ICompleteOrderItem[] = thisOrderProductIDs.map(e => ({
            orderID:completeOrderNumber,
            productID:e,
            price:thisOrderProducts.find(d => d.id === e).price,
            discount:thisOrderProducts.find(d => d.id === e).discount,
            quantity:thisOrderItems.filter(d => d.productID === e).map(d => d.qty).reduce((a,b)=>a+b)
        }))

        await this.createItems(completeOrderItems, CompleteOrderStoreNames.OrderItems)
    }

    saveCompleteOrderDiscountItems = async(orderID:number,completeOrderNumber:string) => {
        const discountItems = await this.getItems(StoreNames.OrderDiscountItems) as IOrderDiscountItem[]
        const thisOrderDiscountItems = discountItems.filter(e => e.orderID === orderID && !!e.amount)
        if (!!thisOrderDiscountItems.length){
            thisOrderDiscountItems.sort((a,b)=>a.orderInReceipt - b.orderInReceipt)
            const completeOrderDiscountItems:ICompleteOrderDiscountItem[] = thisOrderDiscountItems.map(e => ({
                orderID:completeOrderNumber,
                name:e.name,
                amount:e.amount,
                orderInReceipt:e.orderInReceipt,
            }))
            await this.createItems(completeOrderDiscountItems, CompleteOrderStoreNames.OrderDiscountItems)
        }
    }

    printingReceiptFromDB = async(completeOrderID:string,isGiftReceipt:boolean) => {
        try {
            const [
                order, 
                allOrderItems, 
                allDiscountItems, 
                allInternalProducts,
                allSkuMapItems,
                mainTypes,
                productTypeMapItems,
                paymentMethods,
            ] = await Promise.all([
                this.getItem(completeOrderID, CompleteOrderStoreNames.Orders) as Promise<ICompleteOrder>,
                this.getItems(CompleteOrderStoreNames.OrderItems) as Promise<ICompleteOrderItem[]>,
                this.getItems(CompleteOrderStoreNames.OrderDiscountItems) as Promise<ICompleteOrderDiscountItem[]>,
                this.getItems(StoreNames.ProductsInternal) as Promise<IProductInternal[]>,
                this.getItems(StoreNames.SkuMapItems) as Promise<ISkuMapItem[]>,
                this.getItems(StoreNames.ProductMainTypes) as Promise<ISpecification[]>,
                this.getItems(StoreNames.ProductTypeMapItems) as Promise<IProductTypeMapItem[]>,
                this.getItems(StoreNames.PaymentMethods) as Promise<ISpecification[]>,
            ])
            const thisOrderItems = allOrderItems.filter(e => e.orderID === completeOrderID)
            const thisOrderProductIDs = thisOrderItems.map(e => e.productID)
            const thisOrderDiscountItems = allDiscountItems.filter(e => e.orderID === completeOrderID)
            const thisSkuMapItems = allSkuMapItems.filter(e => thisOrderProductIDs.includes(e.external))
            const thisInternalProductIDs = [...new Set(thisSkuMapItems.map(e => e.internal))]
            const thisInternalProducts = allInternalProducts.filter(e => thisInternalProductIDs.includes(e.id))

            const productTypeMap = new Map(productTypeMapItems.map(e => ([e.id,e.mainTypeID])))
            const mainTypeMap = new Map(mainTypes.map(e => ([e.id,e.name])))

            // Order Items
            let obj:{[k:string]:ICompleteOrderItem[]} = {}

            for (const item of thisOrderItems){
                const thisInternalProductIDs = thisSkuMapItems.filter(e => e.external === item.productID).map(e => e.internal)
                if (thisInternalProductIDs.length === 1){
                    const productTypeID = thisInternalProducts.find(e => e.id === thisInternalProductIDs[0]).productTypeID
                    const mainTypeID = productTypeMap.get(productTypeID)
                    let mainTypeName = mainTypeMap.get(mainTypeID).replaceAll('-',' ')
                    if (![1,5,8,9,11,12,13,14].includes(mainTypeID)){
                        mainTypeName = mainTypeName.substring(0, mainTypeName.length - 1)
                    }

                    mainTypeName = mainTypeName.replaceAll(/(^\w|\s\w)/g, m => m.toUpperCase())

                    if (Object.hasOwn(obj,mainTypeName)) obj[mainTypeName].push(item);
                    else obj[mainTypeName] = [item]
                } else {
                    const productTypeIDs = [...new Set(thisInternalProductIDs.map(e => thisInternalProducts.find(d => d.id === e).productTypeID))]
                    const mainTypeIDs = [...new Set(productTypeIDs.map(e => productTypeMap.get(e)))]
                    if (mainTypeIDs.length === 1) {
                        let mainTypeName = mainTypeMap.get(mainTypeIDs[0])
                        if (![1,5].includes(mainTypeIDs[0])){
                            mainTypeName = mainTypeName.substring(0, mainTypeName.length - 1)
                        }
                        mainTypeName = (mainTypeName.replaceAll('-',' ') + ' set').replaceAll(/(^\w|\s\w)/g, m => m.toUpperCase())

                        if (Object.hasOwn(obj,mainTypeName)) obj[mainTypeName].push(item);
                        else obj[mainTypeName] = [item]
                    } else {
                        const mainTypeName = 'Combo Set'
                        if (Object.hasOwn(obj,mainTypeName)) obj[mainTypeName].push(item);
                        else obj[mainTypeName] = [item]
                    }
                }
            }

            // Order Discounts
            if (!!thisOrderDiscountItems.length) thisOrderDiscountItems.sort((a,b)=>a.orderInReceipt - b.orderInReceipt);

            await fetch('/printer/print',{
                method:'POST',
                body:JSON.stringify({
                    orderNumber:completeOrderID,
                    paymentMethod:paymentMethods.find(e => e.id === order.paymentMethod).name,
                    dateTime:order.dt,
                    vat:order.vat,
                    productMap:obj,
                    discounts:thisOrderDiscountItems,
                    amountReceived:order.amountReceived,
                    isGiftReceipt,
                })
            })
        } catch (e) {console.log(e)}
    }

    checkPrinterStatus = async() => {
        const resp = await fetch('/printer/check-status')
        if (!resp.ok){
            switch (resp.status){
                case 503: 
                    dispatchNewEvent(CustomEventKeys.PRINTER_DISCONNECTED)
                    break
                default: 
                    dispatchNewEvent(CustomEventKeys.PRINTER_SERVER_OFF)
                    break
            }
            return false
        }
        return true
    }

    uploadNewOrder = async(orderID:string) => {
        const [order,allItems,allDiscounts] = await Promise.all([
            this.getItem(orderID,CompleteOrderStoreNames.Orders) as Promise<ICompleteOrder>,
            this.getItems(CompleteOrderStoreNames.OrderItems) as Promise<ICompleteOrderItem[]>,
            this.getItems(CompleteOrderStoreNames.OrderDiscountItems) as Promise<ICompleteOrderDiscountItem[]>
        ])

        const items = allItems.filter(e => e.orderID === orderID)
        const discounts = allDiscounts.filter(e => e.orderID === orderID)

        const resp = await fetch('/api/pos/upload-new-order',{
            method:'POST',
            body:JSON.stringify({order,items,discounts})
        })

        if (resp.ok){
            order.uploaded = true
            await this.updateItem(order,CompleteOrderStoreNames.Orders)
        }
    }

    uploadOrders = async() => {
        const [allOrders,allItems,allDiscounts,allRefundItems] = await Promise.all([
            this.getItems(CompleteOrderStoreNames.Orders) as Promise<ICompleteOrder[]>,
            this.getItems(CompleteOrderStoreNames.OrderItems) as Promise<ICompleteOrderItem[]>,
            this.getItems(CompleteOrderStoreNames.OrderDiscountItems) as Promise<ICompleteOrderDiscountItem[]>,
            this.getItems(CompleteOrderStoreNames.RefundItems) as Promise<IRefundItem[]>,
        ])

        const orders = allOrders.filter(e => !e.uploaded) // allOrders.filter(e => e.id.startsWith('EDH-260416-') || e.id.startsWith('EDH-260417-')) // 
        const refundItems = allRefundItems.filter(e => !e.uploaded)
        const ordersUpdated = allOrders.filter(e => e.uploaded && !!e.dbToBeUpdated)

        if (!orders.length && !refundItems.length && !ordersUpdated.length) {
            dispatchNewEvent(CustomEventKeys.NO_ORDER_TO_UPLOAD)
            return
        }

        dispatchNewEvent(CustomEventKeys.PRINTING_START)

        if (!!orders.length) {
            const orderNumbers = orders.map(e => e.id)

            try {
                await fetch('/api/pos/upload-orders',{method:'POST',body:JSON.stringify({orders})})
            } catch (e) {
                console.log(e)
                dispatchNewEvent(CustomEventKeys.PRINTING_END)
                return
            }

            for (const id of orderNumbers) {
                const items = allItems.filter(e => e.orderID === id)
                try {
                    const resp = await fetch('/api/pos/upload-order-items',{method:'POST',body:JSON.stringify({items})})
                    if (!resp.ok && resp.status !== 500) {
                        const text = await resp.text()
                        console.log(`items ${id}: ${resp.status} ${text}`)
                        continue
                    }
                } catch (e) {
                    console.log('items: '+ e)
                    continue
                }

                const discounts = allDiscounts.filter(e => e.orderID === id)
                if (!!discounts.length) {
                    try {
                        const resp = await fetch('/api/pos/upload-order-discounts',{method:'POST',body:JSON.stringify({discounts})})
                        if (!resp.ok && resp.status !== 500) {
                            const text = await resp.text()
                            console.log(`discounts ${id}: ${resp.status} ${text}`)
                            continue
                        }
                    } catch (e) {
                        console.log('discounts: '+ e)
                        continue
                    }
                }

                const order = await this.getItem(id,CompleteOrderStoreNames.Orders) as ICompleteOrder
                await this.updateItem({...order,uploaded:true,dbToBeUpdated:false},CompleteOrderStoreNames.Orders)
                console.log('order ' + id + ' done')
            }
        }

        if (!!refundItems.length){
            for (const item of refundItems){
                try {
                    const resp = await fetch('/api/pos/upload-refund',{method:'POST',body:JSON.stringify(item)})
                    if (resp.ok || resp.status === 500){
                        await this.updateItem({...item,uploaded:true,dbToBeUpdated:false},CompleteOrderStoreNames.RefundItems)
                        console.log('refund ' + item.id + ' done')
                    } else {
                        const text = await resp.text()
                        console.log(`refund ${item.id}: ${resp.status} ${text}`)
                        continue
                    }
                } catch (e) {
                    console.log('refund: ' + e)
                    continue
                }
            }
        }

        if (!!ordersUpdated.length){
            try {
                const resp = await fetch('/api/pos/update-orders',{method:'POST',body:JSON.stringify({orders:ordersUpdated})})
                if (resp.ok){
                    await this.updateItems(ordersUpdated.map(e => ({...e,dbToBeUpdated:false})),CompleteOrderStoreNames.Orders)
                } else {
                    const text = await resp.text()
                    console.log('failed updating orders: ' + text)
                }
            } catch (e) {
                console.log(e)
            }
        }

        dispatchNewEvent(CustomEventKeys.PRINTING_END)
        dispatchNewEvent(CustomEventKeys.UPLOAD_SUCCESS);
    }

    submitOrder = async(orderID:number,paymentMethod:number,isGiftReceipt:boolean) => {
        const printerStatusOK = await this.checkPrinterStatus()
        if (!printerStatusOK) return
        dispatchNewEvent(CustomEventKeys.PRINTING_START)

        const completeOrderNumber = await this.getCompleteOrderNumber()

        let amountReceived = 0
        if (paymentMethod === 1){
            const cashReceivedElem = document.getElementById(ElementID.AMOUNT_RECEIVED) as HTMLParagraphElement
            if (!!cashReceivedElem) {
                const tempAmountReceived = +cashReceivedElem.innerText
                if (!isNaN(tempAmountReceived)) amountReceived = Math.round(tempAmountReceived * 100)
            }
        }

        let vat = 0
        if (chargeVAT){
            const subtotal = await this.getOrderSubtotal(orderID)
            vat = Math.round(subtotal * vatRate / (1 + vatRate))
        }

        const completeOrder:ICompleteOrder = {
            id:completeOrderNumber,
            paymentMethod,
            dt:Date.now(),
            amountReceived,
            uploaded:false,
            vat,
        }

        await Promise.all([
            this.createItem(completeOrder,CompleteOrderStoreNames.Orders),
            this.saveCompleteOrder(orderID,completeOrderNumber),
            this.saveCompleteOrderItems(orderID,completeOrderNumber),
            this.saveCompleteOrderDiscountItems(orderID,completeOrderNumber),
        ])

        await this.printingReceiptFromDB(completeOrderNumber,isGiftReceipt)

        dispatchNewEvent(CustomEventKeys.ORDER_STATUS_UPDATED)
        dispatchNewEvent(CustomEventKeys.PRINTING_END)
        dispatchNewEvent(CustomEventKeys.ORDER_COMPLETE)

        // await this.uploadNewOrder(completeOrderNumber)
    }
}
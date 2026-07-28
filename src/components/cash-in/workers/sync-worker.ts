import { IDB } from "../../../hooks/class-db";
import { IProductExternal, StoreNames } from "../../../interfaces";

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
    // launch()

    if (!initialized) {
        idb = new IDB()
        await idb.initDB()
    }

    
}

export {};
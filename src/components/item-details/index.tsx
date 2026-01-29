'use client'

import { useEffect, useRef, useState } from "react"
import { ProductIdContext } from "./contexts"
import Grid from '@mui/material/Grid2'
import Selector from "./selector"
import SalesTable from "./sales"
import { IDB } from "src/hooks/class-db"
import { StoreNames } from "src/interfaces"

const ItemDetails = () => {
    const [productID,setProductID] = useState('')
    const updateProductID = (v:string) => setProductID(v)
    const idb = useRef<IDB>(null)
    const [ids, setIDs] = useState<string[]>([])
    const initDB = async() => {
        idb.current = new IDB()
        await idb.current.initDB()
        
        try {
            const _ids = await idb.current.getIDs(StoreNames.ProductsExternal) as string[]
            setIDs([..._ids])
        } catch (e) {}
    }

    const timestamp = useRef(0)
    const inputValue = useRef('')
    const otherKeyPressed = (e:KeyboardEvent) => e.altKey || e.shiftKey || e.ctrlKey || e.metaKey
    const blurAllInputButtonElements = () => {
        ['input','button'].forEach(e => {
            const elems = document.getElementsByTagName(e) as HTMLCollectionOf<HTMLInputElement|HTMLButtonElement>
            for (const elem of elems){
                elem.blur()
            }
        })
    }
    const onKeyDown = async (e:KeyboardEvent) => {
        if (e.timeStamp - timestamp.current > 20) {
            if (e.key.length === 1 && !otherKeyPressed(e)) inputValue.current = e.key
        } else {
            if (e.key.length === 1 && !otherKeyPressed(e)) inputValue.current += e.key
            else if (e.key === 'Enter') {
                blurAllInputButtonElements()
                if (ids.includes(inputValue.current)) {
                    setProductID(inputValue.current)
                    inputValue.current = ''
                } else {
                    setProductID(null)
                    inputValue.current = ''
                }
            }
        }
        timestamp.current = e.timeStamp
    }

    useEffect(()=>{
        document.title = 'Item Details'
        initDB()
    },[])

    useEffect(()=>{
        window.addEventListener('keydown',onKeyDown)

        return () => {
            window.removeEventListener('keydown',onKeyDown)
        }
    },[ids])

    return (
        <ProductIdContext.Provider value={{productID,updateProductID}}>
            <Grid container direction='row' columnGap={2}>
                <Selector />
                {!!productID && <>
                <SalesTable />
                </>}
            </Grid>
        </ProductIdContext.Provider>
    )
}

export default ItemDetails
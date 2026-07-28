import Typography from '@mui/material/Typography'
import { useEffect, useRef, useState } from 'react'
import { IDB } from '../../../hooks/class-db'
import { IProductExternal, StoreNames } from '../../../interfaces'

const Price = ({id}:{id:string}) => {
    const idb = useRef<IDB>(null)
    const loading = useRef(true)
    const [price,setPrice] = useState(0)
    const [discount,setDiscount] = useState(0)
    const initDB = async() => {
        idb.current = new IDB()
        await idb.current.initDB()
        loading.current = false
        await getPrice()
    }
    const getPrice = async() => {
        if (loading.current) return

        loading.current = true
        try {
            const product = await idb.current.getItem(id, StoreNames.ProductsExternal) as IProductExternal
            if (!product) {
                setDiscount(0)
                setPrice(0)
                loading.current = false
                return
            }
            const {price:_price,discount:_discount} = product
            setDiscount(_discount)
            setPrice(_price)
        } catch (e) {
            setDiscount(0)
            setPrice(0)
        }
        loading.current = false
    }

    useEffect(()=>{
        initDB()
    },[])

    useEffect(()=>{
        getPrice()
    },[id])

    if (!!discount && !!price) return (
        <Typography sx={{fontSize:'2rem'}}>Net Price: <strong>£ {((price - discount) * 0.01).toFixed(2)}</strong></Typography>
    ) 
    else if (!!price) return (
        <Typography sx={{fontSize:'2rem'}}>Price: <strong>£ {(price * 0.01).toFixed(2)}</strong></Typography>
    )
    return <></>
}

export default Price
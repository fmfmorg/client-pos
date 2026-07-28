'use client'

import { useCallback, useEffect, useState } from "react"
import Filters from "./filters"
import ProductList from "./products"
import DateSelector from "../../misc/date-selector"
import { ProductTypeContext } from "./contexts"

const SalesReport = () => {
    const [selectSubTypes,setSelectSubTypes] = useState(false)
    const updateSelectSubTypes = useCallback((v:boolean) => setSelectSubTypes(v),[selectSubTypes])
    const [productTypes,setProductTypes] = useState<number[]>([])
    const updateProductTypes = useCallback((v:number[]) => setProductTypes([...v]),[productTypes])
    const [productSubTypes,setProductSubTypes] = useState<number[]>([])
    const updateProductSubTypes = useCallback((v:number[]) => setProductSubTypes([...v]),[productSubTypes])

    useEffect(()=>{
        document.title = 'Sales'
    },[])

    return (
        <ProductTypeContext value={{productTypes,updateProductTypes,productSubTypes,updateProductSubTypes,selectSubTypes,updateSelectSubTypes}}>
            <DateSelector 
                children={<ProductList />}
                filters={<Filters />}
            />
        </ProductTypeContext>
    )
}

export default SalesReport
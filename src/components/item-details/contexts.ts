import { createContext } from "react";

export const ProductIdContext = createContext<{
    productID:string;
    updateProductID: (v: string) => void
}>({
    productID:'',
    updateProductID:()=>{},
})
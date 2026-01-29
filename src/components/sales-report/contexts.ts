import { createContext } from "react";

export const ProductTypeContext = createContext<{
    productTypes:number[];
    updateProductTypes:(v:number[])=>void;
    productSubTypes:number[];
    updateProductSubTypes:(v:number[])=>void;
    selectSubTypes:boolean;
    updateSelectSubTypes:(v:boolean)=>void;
}>({
    productTypes:[],
    updateProductTypes:()=>{},
    productSubTypes:[],
    updateProductSubTypes:()=>{},
    selectSubTypes:false,
    updateSelectSubTypes:()=>{},
})
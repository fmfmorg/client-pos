import { createContext } from "react";

export const DateContext = createContext<{
    date:number;
    updateDate:(v:number)=>void;
}>({
    date:0,
    updateDate:()=>{},
});

export const OrderNumberContext = createContext<{
    orderNumber:string;
    updateOrderNumber:(v:string)=>void;
}>({
    orderNumber:'',
    updateOrderNumber:()=>{},
})
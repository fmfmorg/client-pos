import { createContext } from "react";

const Context = createContext<{
    currentOrderID:number;
    createNewOrder:()=>void;
    orderIdOnUpdate:(v:number)=>void;
}>({
    currentOrderID:0,
    createNewOrder:()=>{},
    orderIdOnUpdate:()=>{},
})

export default Context
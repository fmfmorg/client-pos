import { createContext } from "react";

export const DateContext = createContext<{
    start:number;
    end:number;
}>({
    start:0,
    end:0,
})

export const UpdateDateContext = createContext<{
    updateDate:(v:number,isStart:boolean)=>void;
}>({
    updateDate:()=>{},
})
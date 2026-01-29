import { createContext } from "react";

export const SubTypeContext = createContext<{
    subTypeIDs:number[];
    updateSubTypeIDs:(v:number[])=>void;
    columns:number;
}>({
    subTypeIDs:[],
    updateSubTypeIDs:()=>{},
    columns:0,
})

export const FilterContext = createContext<{
    stars:number[];
    updateStars:(v:number[])=>void;
    toggleFilter:()=>void;
    colorOpts:number[];
    colors:number[];
    updateColors:(v:number[])=>void;
}>({
    stars:[],
    updateStars:()=>{},
    toggleFilter:()=>{},
    colorOpts:[],
    colors:[],
    updateColors:()=>{},
})
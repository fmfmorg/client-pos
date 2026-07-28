import { CustomEventKeys } from "@misc";

export const dispatchNewEvent = (k:CustomEventKeys,v?:any) => document.dispatchEvent(new CustomEvent(k,{detail:v}))
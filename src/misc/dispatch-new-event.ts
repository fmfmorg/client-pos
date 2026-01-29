import { CustomEventKeys } from "@misc";

export const dispatchNewEvent = (k:CustomEventKeys) => document.dispatchEvent(new CustomEvent(k))
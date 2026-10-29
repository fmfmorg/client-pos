import { AlertColor } from "@mui/material";

export interface IOrder {
    id:number;
    status:number;
    completeOrderNumber:string;
}

export interface IOrderItem {
    orderID:number;
    productID:string;
    qty:number;
    dt:number;
    id?:number;
}

export interface IOrderDiscountItem {
    orderID:number;
    name:string;
    amount:number;
    orderInReceipt:number;
    id?:number;
    values:(number|string)[];
}

export interface IOrder {
    id:number; // Date.now() * 0.001 as temporary ID
}

export enum StoreNames {
    ProductsExternal =      'productsExternal',
    ProductsInternal =      'productsInternal',
    MetalColors =           'metalColors',
    ProductMainTypes =      'productMainTypes',
    ProductSubTypes =       'productSubTypes',
    ProductTypeMapItems =   'productTypeMapItems',
    SkuMapItems =           'skuMapItems',
    Orders =                'orders',
    OrderItems =            'orderItems',
    OrderDiscountItems =    'orderDiscountItems',
    PaymentMethods =        'paymentMethods'
}

export enum CompleteOrderStoreNames {
    Orders =                'completeOrders',
    OrderItems =            'completeOrderItems',
    OrderDiscountItems =    'completeOrderDiscountItems',
    RefundItems =           'completeOrderRefundItems',
}

export interface ICompleteOrder {
    id:string;
    paymentMethod:number;
    dt:number;
    amountReceived:number;
    uploaded:boolean;
    vat:number;
    note?:string;
    dbToBeUpdated?:boolean;
}

export interface ICompleteOrderItem {
    id?:number;
    orderID:string;
    productID:string;
    price:number;
    discount:number;
    quantity:number;
    uploaded?:boolean;
    rl?:boolean;
    fk?:boolean;
}

export interface ICompleteOrderDiscountItem {
    id?:number;
    orderID:string;
    name:string;
    amount:number;
    orderInReceipt:number;
    uploaded?:boolean;
    rl?:boolean;
    fk?:boolean;
}

export interface IProductExternal {
    id:string;
    price:number;
    discount:number;
    keepInCollection:number;
    premium?:boolean;
    stock?:number;
    dbToBeUpdated?:boolean;
    stockLevelToBeUpdated?:boolean;
}

export interface IProductInternal {
    id:string;
    metalColorID:number;
    productTypeID:number;
    image:string;
    receivedQuantity:number;
    url:string;
    variation:string;
}

export interface ISpecification {
    id:number;
    name:string;
}

export interface IProductTypeMapItem {
    id:number;
    mainTypeID:number;
    subTypeID:number;
}

export interface ISkuMapItem {
    id:number;
    external: string;
    internal: string;
}

export interface IRefundItem {
    id?:number;
    orderID:string;
    productID:string;
    quantity:number;
    amount:number;
    dt:number;
    note:string;
    uploaded:boolean;
    dbToBeUpdated:boolean;
}

export interface IAlertMessage {
    color:AlertColor;
    message:string;
}

export interface IListDetails {
    start:number;
    end:number;
}
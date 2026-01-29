enum OrdersInReceipt {
    BuyXForY = 1,
    ManualDiscountPercentage,
    ManualDiscountFixedAmount,
}

export enum BuyXForY {
    QUANTITY_X = 3,
    SET_PRICE_Y = 2500,
    ORDER_IN_RECEIPT = OrdersInReceipt.BuyXForY,
    NAME_ON_RECEIPT = 'Buy X for Y',
}

export enum ManualDiscountPercentage {
    ORDER_IN_RECEIPT = OrdersInReceipt.ManualDiscountPercentage,
    NAME_ON_RECEIPT = 'Discount X%',
    NAME_SELECT_MENU = '-X%',
}

export enum ManualDiscountFixedAmount {
    ORDER_IN_RECEIPT = OrdersInReceipt.ManualDiscountFixedAmount,
    NAME_ON_RECEIPT = 'Discount £X',
    NAME_SELECT_MENU = '-£X',
}

export const nameBuyXForY = BuyXForY.NAME_ON_RECEIPT.replace('X',BuyXForY.QUANTITY_X.toString()).replace('Y',`£${Math.round(BuyXForY.SET_PRICE_Y * 0.01)}`)
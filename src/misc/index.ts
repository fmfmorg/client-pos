import { dispatchNewEvent } from "./dispatch-new-event";
import { sessionMinutes } from "./session-minutes";
import { sleep } from "./sleep";
import { cleanNumberString } from './clean-number-string'

export {
    dispatchNewEvent,
    sessionMinutes,
    sleep,
    cleanNumberString,
}

export enum ElementID {
    AMOUNT_RECEIVED = 'amount-received'
}

export const broadcastChannelName = 'broadcast-channel'

export enum CustomEventKeys {
    PRODUCTS_UPDATE_SUCCESSFUL = 'products_update_successful',
    PRODUCTS_UPDATE_FAILED = 'products_update_failed',
    ORDER_ID_LIST_UPDATED = 'order_id_list_updated',
    ORDER_ITEM_LIST_UPDATED = 'order_item_list_updated',
    ORDER_ITEM_NEW_ADDED = 'order_item_new_added',
    ORDER_STATUS_UPDATED = 'order_status_updated',
    ORDER_COMPLETE = 'order_complete',
    NEXT_ORDER = 'next_order',
    PRINTING_START = 'printing_start',
    PRINTING_END = 'printing_end',
    PRINTER_DISCONNECTED = 'printer_disconnected',
    PRINTER_SERVER_OFF = 'printer_server_off',

    NO_ORDER_TO_UPLOAD = 'no_order_to_upload',

    UPLOAD_SUCCESS = 'upload_success',
    UPLOAD_FAILED = 'upload_failed',

    REFUND_SUBMITED = 'refund_submitted',
    REFUND_UPLOADED = 'refund_uploaded',

    COLLECTION_ITEMS_UPDATE = 'collection_items_update',

    STOCK_TO_BE_UPDATED = 'stock_to_be_updated',
    STOCK_UPDATE_REPORT = 'stock_update_report',

    REFRESH_LIST = 'refresh_list',

    ORDER_TO_BE_UPDATED = 'order_to_be_updated',
    ORDER_UPDATE_REPORT = 'order_update_report',

    ORDER_UPLOADED = 'order_uploaded',
    REGULAR_UPLOAD_COMPLETE = 'regular_upload_complete',
}

export const chargeVAT = false
export const vatRate = 0.2 // 20% of net sales as VAT
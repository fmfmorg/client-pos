import { useContext, useEffect, useRef, useState } from "react"

import { NumberField } from '@base-ui-components/react/number-field';
import styles from './index.module.css';

import { CustomEventKeys } from "@misc";
import Context from "@components/contexts";
import { OrderStatusEnum } from "../../../../misc/order-status";
import { IDB } from "../../../../hooks/class-db";
import { IOrder, IOrderItem, StoreNames } from "../../../../interfaces";
import MinusIcon from "../../../../misc/minus-icon";
import PlusIcon from "../../../../misc/plus-icon";


const QuantityField = ({id}:{id:number}) => {
    const {currentOrderID} = useContext(Context)
    const [orderStatus,setOrderStatus] = useState(OrderStatusEnum.EDITING)
    const loading = useRef(true)
    const idb = useRef<IDB>(null)
    const qtyRef = useRef<HTMLInputElement>(null)
    const [quantity,setQuantity] = useState(1)
    const initDB = async () => {
        idb.current = new IDB()
        await idb.current.initDB()
        loading.current = false
        await getQuantity()
    }
    const getQuantity = async () => {
        if (loading.current || !currentOrderID) return

        loading.current = true

        try {
            const order = await idb.current.getItem(currentOrderID,StoreNames.Orders) as IOrder
            if (!!order) setOrderStatus(order.status)
        } catch (e) {}

        try {
            const orderItem = await idb.current.getItem(id, StoreNames.OrderItems) as IOrderItem
            if (!orderItem) {
                setQuantity(0)
                return
            }
            const {qty} = orderItem
            setQuantity(qty)
        } catch (e) {}

        loading.current = false
    }
    
    const timeoutRef = useRef<NodeJS.Timeout>(null)
    const updateQuantity = async (value:number | null) => {
        if (!!value && !!Math.round(value)) {
            setQuantity(Math.round(value))
            await idb.current.orderItemQuantityOnEdit(id,Math.round(value));
        } else if (typeof value === 'number') {
            setQuantity(0)
            await idb.current.orderItemQuantityOnEdit(id,0);
        }
    }

    const getOrderStatus = async() => {
        try {
            const order = await idb.current.getItem(currentOrderID,StoreNames.Orders) as IOrder
            if (!!order) setOrderStatus(order.status)
        } catch (e) {}
    }

    const quantityOnChange = (value: number, _: any) => {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = setTimeout(updateQuantity,50,value)
    }

    const onKeyDown = (e:KeyboardEvent) => {
        if (e.key.toLowerCase() === 'enter') {
            e.preventDefault();
            (e.target as HTMLInputElement).blur()
        }
    }

    useEffect(()=>{
        initDB()
        qtyRef.current?.addEventListener('keydown',onKeyDown)
        return () => {
            qtyRef.current?.removeEventListener('keydown',onKeyDown)
        }
    },[])

    useEffect(()=>{
        document.addEventListener(CustomEventKeys.ORDER_ITEM_LIST_UPDATED,getQuantity)
        document.addEventListener(CustomEventKeys.ORDER_STATUS_UPDATED,getOrderStatus)
        return () => {
            document.removeEventListener(CustomEventKeys.ORDER_ITEM_LIST_UPDATED,getQuantity)
            document.removeEventListener(CustomEventKeys.ORDER_STATUS_UPDATED,getOrderStatus)
        }
    },[id])

    return (
        <NumberField.Root value={quantity} className={styles.Field} min={0} step={1} onValueChange={quantityOnChange} disabled={orderStatus > OrderStatusEnum.EDITING}>
            <NumberField.Group className={styles.Group}>
                <NumberField.Decrement className={styles.Decrement}>
                    <MinusIcon />
                </NumberField.Decrement>
                <NumberField.Input className={styles.Input} ref={qtyRef} />
                <NumberField.Increment className={styles.Increment}>
                    <PlusIcon />
                </NumberField.Increment>
            </NumberField.Group>
        </NumberField.Root>
    )
}

export default QuantityField
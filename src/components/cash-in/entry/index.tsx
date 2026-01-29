import Stack from '@mui/material/Stack';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import { FormEvent, useContext, useEffect, useId, useRef, useState } from 'react';
import { IDB } from 'src/hooks/class-db';
import { CustomEventKeys } from '@misc';
import Grid from '@mui/material/Grid2'
import { NumberField } from '@base-ui-components/react/number-field';
import styles from './index.module.css';
import MinusIcon from 'src/misc/minus-icon';
import PlusIcon from 'src/misc/plus-icon';
import Button from '@mui/material/Button';
import Context from '@components/contexts';
import Box from '@mui/material/Box'
import Images from './images';
import Price from './price';
import { OrderStatusEnum } from 'src/misc/order-status';
import { IOrder, StoreNames } from 'src/interfaces';

const EntryComponent = () => {
    const formID = useId()
    const {currentOrderID} = useContext(Context)
    const skuRef = useRef<HTMLInputElement>(null)
    const qtyRef = useRef<HTMLInputElement>(null)
    const imagesRef = useRef<HTMLDivElement>(null)
    const loading = useRef(true)
    const idb = useRef<IDB>(null)
    const [disabled,setDisabled] = useState(false)
    const [id,setID] = useState<string>(null)
    const [ids, setIDs] = useState<string[]>([])
    const [quantity,setQuantity] = useState(1)
    const initDB = async() => {
        idb.current = new IDB()
        await idb.current.initDB()
        await getAllProductIDs()
        loading.current = false
        await getOrderStatus()
    }
    const getAllProductIDs = async() => {
        const _ids = await idb.current.getIDs(StoreNames.ProductsExternal) as string[]
        setIDs([..._ids])
    }

    const skuOnChange = (_:any, v:string|string[]|null) => {
        if (typeof v === 'string' && !!v) setID(v)
        else setID(null)
    }

    const quantityOnChange = (value: number | null, _: Event | undefined) => {
        if (!!value) setQuantity(value)
    }

    const resizeImageList = () => {
        const marginTop = document.body.getBoundingClientRect().top
        const imageTop = imagesRef.current.getBoundingClientRect().top
        imagesRef.current.style.height = `calc(100vh - ${marginTop + imageTop}px)`
    }

    const timestamp = useRef(0)
    const inputValue = useRef('')
    const otherKeyPressed = (e:KeyboardEvent) => e.altKey || e.ctrlKey || e.metaKey //|| e.shiftKey

    const submitOnKeyDown = (e:React.KeyboardEvent<HTMLButtonElement>) => {
        if (e.key.toLowerCase() === 'tab' && !e.altKey && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
            e.preventDefault()
            skuRef.current.select()
        }
    }

    const blurAllInputButtonElements = () => {
        ['input','button'].forEach(e => {
            const elems = document.getElementsByTagName(e) as HTMLCollectionOf<HTMLInputElement|HTMLButtonElement>
            for (const elem of elems){
                elem.blur()
            }
        })
    }

    const onKeyDown = async (e:KeyboardEvent) => {
        if (e.timeStamp - timestamp.current > 20) {
            if (e.key.length === 1 && !otherKeyPressed(e)) inputValue.current = e.key
        } else {
            if (e.key.length === 1 && !otherKeyPressed(e)) inputValue.current += e.key
            else if (e.key === 'Enter') {
                blurAllInputButtonElements()
                if (ids.includes(inputValue.current)) {
                    await idb.current.newOrderItemEntry(currentOrderID,inputValue.current,1)
                    setID(inputValue.current)
                    setQuantity(1)
                    inputValue.current = ''
                } else {
                    setID(null)
                    setQuantity(1)
                    inputValue.current = ''
                }
            }
        }
        timestamp.current = e.timeStamp
    }

    const onManualSubmit = (e:FormEvent) => {
        e.preventDefault()
        const valueInInput = +qtyRef.current.value
        if (!isNaN(valueInInput) && !!Math.round(valueInInput)) idb.current.newOrderItemEntry(currentOrderID,id,Math.round(valueInInput));
        else if (!isNaN(quantity) && !!Math.round(quantity)) idb.current.newOrderItemEntry(currentOrderID,id,Math.round(quantity));
    }

    const orderOnChange = async () => {
        setQuantity(1)
        setID(null)
    }

    const getOrderStatus = async() => {
        if (loading.current || !currentOrderID) return

        loading.current = true

        try {
            const order = await idb.current.getItem(currentOrderID,StoreNames.Orders) as IOrder
            if (!!order) setDisabled(order.status !== OrderStatusEnum.EDITING)
        } catch (e) {}

        loading.current = false
    }

    useEffect(()=>{
        initDB()
        resizeImageList()
        document.addEventListener(CustomEventKeys.PRODUCTS_UPDATE_SUCCESSFUL,getAllProductIDs)

        return () => {
            document.removeEventListener(CustomEventKeys.PRODUCTS_UPDATE_SUCCESSFUL,getAllProductIDs)
        }
    },[])

    useEffect(()=>{
        orderOnChange()
        getOrderStatus()
        window.addEventListener('keydown',onKeyDown)
        document.addEventListener(CustomEventKeys.ORDER_STATUS_UPDATED,getOrderStatus)
        return () => {
            window.removeEventListener('keydown',onKeyDown)
            document.removeEventListener(CustomEventKeys.ORDER_STATUS_UPDATED,getOrderStatus)
        }
    },[currentOrderID])

    return (
        <Stack direction='column' rowGap={1} component='form' onSubmit={onManualSubmit} id={formID} name={formID}>
            <Autocomplete 
                fullWidth
                renderInput={(params) => <TextField {...params} label="SKU #" inputRef={skuRef} />}
                options={ids}
                sx={{mt:1}}
                onChange={skuOnChange}
                value={id}
                disabled={disabled}
            />
            <Grid container direction='row'>
                <Grid size={{sm:7}}>
                    <NumberField.Root value={quantity} className={styles.Field} min={1} onValueChange={quantityOnChange} disabled={disabled}>
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
                </Grid>
                <Grid size={{sm:5}}>
                    <Button variant='contained' fullWidth sx={{height:'100%'}} type='submit' onKeyDown={submitOnKeyDown} disabled={disabled}>Add</Button>
                </Grid>
            </Grid>
            <Box ref={imagesRef} sx={{overflowY:'auto'}}>
                {!!id && <Price id={id} />}
                {!!id && <Images {...{id}} />}
            </Box>
        </Stack>
    )
}

export default EntryComponent
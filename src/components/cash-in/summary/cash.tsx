import Context from "@components/contexts"
import { cleanNumberString } from "@misc"
import Button from "@mui/material/Button"
import InputAdornment from "@mui/material/InputAdornment"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import Stack from "@mui/system/Stack"
import { ChangeEvent, FormEvent, useContext, useEffect, useRef, useState } from "react"
import { IDB } from "src/hooks/class-db"
import { OrderStatusEnum } from "src/misc/order-status"

const Cash = (
    {
        cashReceived,
        updateCashReceived,
        orderSubtotal,
    }:{
        cashReceived:number;
        updateCashReceived:(v:number)=>void;
        orderSubtotal:number;
    }
) => {
    const inputRef = useRef<HTMLInputElement>(null)
    const [btnDisabled,setBtnDisabled] = useState(true)
    const {currentOrderID} = useContext(Context)
    const idb = useRef<IDB>(null)
    const initDB = async() => {
        idb.current = new IDB()
        await idb.current.initDB()
    }
    const onInputChange = (e:ChangeEvent) => {
        const {value} = e.target as HTMLInputElement
        const tempValue = +value
        setBtnDisabled(!orderSubtotal || isNaN(tempValue) || tempValue * 100 < orderSubtotal)
    }
    const onSubmit = (e:FormEvent) => {
        e.preventDefault()

        const {value} = inputRef.current
        updateCashReceived(100 * +value)
        idb.current.updateOrderStatus(currentOrderID,OrderStatusEnum.READY_CASH)
    }

    useEffect(()=>{
        initDB()
        inputRef.current.value = !!cashReceived ? cleanNumberString((cashReceived * 0.01).toFixed(2)) : ''
        setBtnDisabled(!orderSubtotal || !cashReceived || cashReceived < orderSubtotal)


    },[])

    useEffect(()=>{
        const {value} = inputRef.current
        const tempValue = +value
        setBtnDisabled(!orderSubtotal || isNaN(tempValue) || tempValue * 100 < orderSubtotal)
    },[orderSubtotal])

    return (
        <Stack direction='row' columnGap={1} component='form' id='cash-form' onSubmit={onSubmit}>
            <TextField 
                fullWidth
                inputRef={inputRef}
                size='small'
                id='cash-field'
                slotProps={{
                    input:{
                        sx:{fontSize:'1.4rem',letterSpacing:'0.3rem'},
                        startAdornment:<InputAdornment position="start"><Typography variant="h5">£</Typography></InputAdornment>,
                        type:'number',
                    },
                    htmlInput:{
                        step:0.01,
                        min:0,
                        sx:{textAlign:'center'}
                    }
                }}
                onChange={onInputChange}
            />
            <Button type='submit' variant="contained" color='secondary' size='small' sx={{fontSize:'1.2rem',px:3}} disabled={btnDisabled}>Cash</Button>
        </Stack>
    )
}

export default Cash
import TableCell from "@mui/material/TableCell"
import TableRow from "@mui/material/TableRow"
import { useMemo, useRef } from "react"
import IncomeCell from "./income-cell"
import OrderCounter from "./order-counter"

const IncomeRow = (
    {
        dateUnix,
        firstRow,
    }:{
        dateUnix:number;
        firstRow:boolean;
    }
) => {
    const date = useMemo(()=>{
        const dt = new Date(dateUnix)
        return dt.toLocaleDateString('en-US',{month:'2-digit',day:'2-digit'})
    },[])

    const day = useMemo(()=>{
        const dt = new Date(dateUnix)
        return dt.toLocaleDateString('en-GB',{weekday:'short'})
    },[dateUnix])
    const paymentMethodOrder = useRef([2,1,0])
    
    return (
        <TableRow 
            sx={{
                backgroundColor:day[0] === 'S' ? 'rgba(255,255,0,0.3)' : 'transparent',
                ':hover':{
                    backgroundColor:day[0] === 'S' ? 'rgba(255,255,0,0.7)' : 'rgba(0,0,0,0.07)',
                }
            }}
        >
            <TableCell>{date}</TableCell>
            <TableCell>{day}</TableCell>
            <OrderCounter {...{dateUnix,firstRow}} />
            {paymentMethodOrder.current.map(e => <IncomeCell key={e} {...{dateUnix,paymentMethod:e,firstRow}} />)}
        </TableRow>
    )
}

export default IncomeRow
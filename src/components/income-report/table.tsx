import { useTheme } from "@mui/material"
import Table from "@mui/material/Table"
import TableBody from "@mui/material/TableBody"
import TableCell from "@mui/material/TableCell"
import TableContainer from "@mui/material/TableContainer"
import TableHead from "@mui/material/TableHead"
import TableRow from "@mui/material/TableRow"
import Typography from "@mui/material/Typography"
import { useContext, useEffect, useMemo, useRef } from "react"
import { DateContext } from "src/misc/date-selector/date-contexts"
import HeaderCell from "./header-cell"
import IncomeRow from "./income-row"
import HeaderTotalOrderCount from "./header-total-order-count"

const IncomeTable = () => {
    const headers = useRef(['Date','Day'])
    const {palette} = useTheme()
    const {start,end} = useContext(DateContext)
    const datesUnix = useMemo(()=>{
        let arr:number[] = []
        let tempEnd = end

        while (tempEnd > start) {
            arr.push(tempEnd)
            tempEnd -= 86400000
        }

        return arr
    },[start,end])

    useEffect(()=>{
        document.title = 'Income'
    },[])

    return (
        <TableContainer sx={{display:'flex',justifyContent:'center'}}>
            <Table 
                sx={{
                    maxWidth:'800px',
                    '* th, * td':{
                        borderWidth:'1px',
                        borderColor:palette.grey[300],
                        borderStyle:'solid'
                    },
                }}
            >
                <TableHead>
                    <TableRow>
                        {headers.current.map(e => <TableCell key={e}><Typography>{e}</Typography></TableCell>)}
                        <HeaderTotalOrderCount />
                        <HeaderCell {...{text:'Card',paymentMethod:2}} />
                        <HeaderCell {...{text:'Cash',paymentMethod:1}} />
                        <HeaderCell {...{text:'Total'}} />
                    </TableRow>
                </TableHead>
                <TableBody>
                    {datesUnix.map((e,i) => <IncomeRow key={e} {...{dateUnix:e,firstRow:i === 0}} />)}
                </TableBody>
            </Table>
        </TableContainer>
    )
}

export default IncomeTable
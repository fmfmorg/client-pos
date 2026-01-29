import Box from "@mui/material/Box"
import { JSX, useState } from "react"
import { DateContext, UpdateDateContext } from "./date-contexts"
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import Stack from "@mui/material/Stack";
import MyDatePicker from "./datepicker";

const DateSelector = (
    {
        children,
        filters,
    }:{
        children:JSX.Element;
        filters?:JSX.Element;
    }
) => {
    const initStartDT = () => {
        const now = new Date()
        now.setHours(1,0,0,0)
        return now.valueOf()
    }
    const initEndDT = () => {
        const now = new Date()
        now.setHours(22,59,59,999)
        return now.valueOf()
    }
    const [start,setStart] = useState(initStartDT())
    const [end,setEnd] = useState(initEndDT())
    const updateDate = (v:number,isStart:boolean) => {
        if (isStart) setStart(v);
        else setEnd(v);
    }
    
    return (
        <Box sx={{width:'100%'}}>
            <AppBar sx={{backgroundColor:'#fff'}}>
                <Toolbar />
            </AppBar>
            <Toolbar sx={theme => ({zIndex: theme.zIndex.drawer + 1, display:'flex',flexDirection:'row',justifyContent:'flex-start',position:'sticky',top:0})}>
                <Stack direction='row' columnGap={2}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <UpdateDateContext value={{updateDate}}>
                            <DateContext value={{start,end}}>
                                <MyDatePicker isStart={true} />
                                <MyDatePicker isStart={false} />
                            </DateContext>
                        </UpdateDateContext>
                    </LocalizationProvider>
                    {!!filters && filters}
                </Stack>
            </Toolbar>
            <DateContext value={{start,end}}>
                {children}
            </DateContext>
        </Box>
    )
}

export default DateSelector
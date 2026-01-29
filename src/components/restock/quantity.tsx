import TextField from "@mui/material/TextField"
import { useRef } from "react"
import { IDB } from "src/hooks/class-db"

const Quantity = ({id}:{id:string}) => {
    const ref = useRef<HTMLInputElement>(null)
    const idb = useRef<IDB>(null)
    const initDB = async() => {
        idb.current = new IDB()
        await idb.current.initDB()
    }

    return (
        <TextField 
            inputRef={ref}
            size="small"
            sx={{
                backgroundColor:'#fff',
                maxWidth:'80px'
            }}
        />
    )
}

export default Quantity
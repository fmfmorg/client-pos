import Button from "@mui/material/Button"
import { useEffect, useRef } from "react";
import { IDB } from "src/hooks/class-db";

const UpdateProductsButton = () => {
    const idb = useRef<IDB>(null);
    const initDB = async () => {
        idb.current = new IDB()
        await idb.current.initDB()
    }
    const onClick = async() => await idb.current.updateDB()

    useEffect(()=>{
        initDB()
    },[])

    return (
        <Button color='error' variant='contained' sx={{fontWeight:'bold',letterSpacing:'0.05rem'}} onClick={onClick}>Update Products</Button>
    )
}

export default UpdateProductsButton
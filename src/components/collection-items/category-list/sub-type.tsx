import FormControlLabel from "@mui/material/FormControlLabel"
import ListItem from "@mui/material/ListItem"
import { useContext, useEffect, useMemo, useRef, useState } from "react"
import { IDB } from "../../../hooks/class-db"
import { IProductTypeMapItem, ISpecification, StoreNames } from "../../../interfaces"
import { SubTypeContext } from "../contexts"
import Checkbox from "@mui/material/Checkbox"

const SubTypeItem = ({id}:{id:number}) => {
    const idb = useRef<IDB>(null)
    const [name,setName] = useState('')
    const {subTypeIDs,updateSubTypeIDs} = useContext(SubTypeContext)
    const initDB = async() => {
        idb.current = new IDB()
        await idb.current.initDB()
        
        try {
            const typeMapItem = await idb.current.getItem(id,StoreNames.ProductTypeMapItems) as IProductTypeMapItem
            const subTypeID = typeMapItem.subTypeID
            const subTypeItem = await idb.current.getItem(subTypeID,StoreNames.ProductSubTypes) as ISpecification
            setName(subTypeItem.name)
        } catch (e) {}
    }
    const selected = useMemo(()=>subTypeIDs.includes(id),[subTypeIDs,id])
    const onChange = () => updateSubTypeIDs([id])

    useEffect(()=>{
        initDB()
    },[])

    return (
        <ListItem sx={{py:0,ml:3}}>
            <FormControlLabel 
                label={name}
                control={
                    <Checkbox 
                        checked={selected}
                    />
                }
                onChange={onChange}
            />
        </ListItem>
    )
}

export default SubTypeItem
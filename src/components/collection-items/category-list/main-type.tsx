import Checkbox from "@mui/material/Checkbox"
import FormControlLabel from "@mui/material/FormControlLabel"
import ListItem from "@mui/material/ListItem"
import { ChangeEvent, useContext, useEffect, useMemo, useRef, useState } from "react"
import { IDB } from "src/hooks/class-db"
import { IProductTypeMapItem, ISpecification, StoreNames } from "src/interfaces"
import { SubTypeContext } from "../contexts"
import SubTypeItem from "./sub-type"

const MainTypeItem = ({id}:{id:number}) => {
    const {subTypeIDs,updateSubTypeIDs} = useContext(SubTypeContext)
    const idb = useRef<IDB>(null)
    const [thisSubTypeIDs,setThisSubTypeIDs] = useState<number[]>([])
    const [typeName,setTypeName] = useState('')
    const selected = useMemo(()=>thisSubTypeIDs.filter(e => subTypeIDs.includes(e)),[subTypeIDs,thisSubTypeIDs])
    const initDB = async() => {
        idb.current = new IDB()
        await idb.current.initDB()
        
        try {
            const [typeMapItems,mainTypeItem] = await Promise.all([
                idb.current.getItems(StoreNames.ProductTypeMapItems) as Promise<IProductTypeMapItem[]>,
                idb.current.getItem(id,StoreNames.ProductMainTypes) as Promise<ISpecification>,
            ])
            setThisSubTypeIDs(typeMapItems.filter(e => e.mainTypeID === id).map(e => e.id))
            setTypeName(mainTypeItem.name)
        } catch (e) {}
    }
    const onChange = (e:ChangeEvent<HTMLInputElement>) => {
        const {checked} = e.target
        if (checked) updateSubTypeIDs(thisSubTypeIDs.filter(e => !selected.includes(e)))
        else updateSubTypeIDs(thisSubTypeIDs.filter(e => selected.includes(e)))
    }

    useEffect(()=>{
        initDB()
    },[])

    return (
        <>
        <ListItem sx={{pb:0}}>
            <FormControlLabel 
                label={typeName}
                control={
                    <Checkbox 
                        checked={thisSubTypeIDs.length === selected.length}
                        indeterminate={selected.length < thisSubTypeIDs.length && !!selected.length}
                    />
                }
                onChange={onChange}
            />
        </ListItem>
        {thisSubTypeIDs.map(id => <SubTypeItem key={id} {...{id}} />)}
        </>
    )
}

export default MainTypeItem
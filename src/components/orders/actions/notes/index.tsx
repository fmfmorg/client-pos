import { OrderNumberContext } from "@components/orders/contexts"
import EditIcon from "@mui/icons-material/Edit"
import Button from "@mui/material/Button"
import Stack from "@mui/material/Stack"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import { ChangeEvent, useContext, useEffect, useRef, useState } from "react"
import { IDB } from "src/hooks/class-db"
import { CompleteOrderStoreNames, ICompleteOrder } from "src/interfaces"

const Notes = () => {
    const {orderNumber} = useContext(OrderNumberContext)
    const [noteInput,setNoteInput] = useState('')
    const [note,setNote] = useState('')
    const [editMode,setEditMode] = useState(false)
    const idb = useRef<IDB>(null)
    const loading = useRef(true)
    const initDB = async() => {
        idb.current = new IDB()
        await idb.current.initDB()
        loading.current = false
        await updateNote()
    }
    const updateNote = async() => {
        if (loading.current) return
        loading.current = true

        setEditMode(false)

        try {
            const order = await idb.current.getItem(orderNumber,CompleteOrderStoreNames.Orders) as ICompleteOrder
            if (!!order.note) setNote(order.note);
            else setNote('');
        } catch (e) {}

        loading.current = false
    }
    const toggleEditMode = () => setEditMode(prev => !prev)
    const textFieldOnChange = (e:ChangeEvent<HTMLInputElement>) => setNoteInput(e.target.value)
    const onCancelEdit = () => {
        setNoteInput(note)
        toggleEditMode()
    }
    const onSubmitEdit = async() => {
        setNote(noteInput)

        try {
            const order = await idb.current.getItem(orderNumber,CompleteOrderStoreNames.Orders) as ICompleteOrder
            order.note = noteInput
            order.dbToBeUpdated = true
            await idb.current.updateItem(order,CompleteOrderStoreNames.Orders)
        } catch (e) {}

        toggleEditMode()
    }

    useEffect(()=>{
        initDB()
    },[])

    useEffect(()=>{
        if (!!orderNumber) updateNote()
    },[orderNumber])

    useEffect(()=>{
        setNoteInput(note)
    },[note])

    return (
        <Stack direction='column' spacing={2} sx={{backgroundColor:'rgba(255,255,0,0.3)', p:1}}>
            {(!editMode && !!note) && <Stack direction='column'>
                <Typography fontWeight='bold'>Note:</Typography>
                <p dangerouslySetInnerHTML={{__html:note.replaceAll('\n','<br />')}} style={{fontFamily:'Roboto'}} />
            </Stack>}
            {!editMode && <Button 
                variant="contained"
                color='secondary'
                startIcon={<EditIcon sx={{scale:1.4,mr:2}} />}
                sx={{fontSize:'1.4rem',letterSpacing:'0.3rem'}}
                onClick={toggleEditMode}
            >{!!note ? 'Edit' : 'Add'} Note</Button>}
            {editMode && <TextField 
                value={noteInput}
                onChange={textFieldOnChange}
                multiline
                fullWidth
                rows={15}
            />}
            {editMode && <Stack direction='row' spacing={2}>
                <Button fullWidth variant='contained' sx={{letterSpacing:'0.1rem',fontSize:'1.1rem'}} onClick={onCancelEdit}>Cancel</Button>
                <Button fullWidth variant='contained' sx={{letterSpacing:'0.1rem',fontSize:'1.1rem'}} color='warning' onClick={onSubmitEdit}>Update</Button>
            </Stack>}
        </Stack>
    )
}

export default Notes
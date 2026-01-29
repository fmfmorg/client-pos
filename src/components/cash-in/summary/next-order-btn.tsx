import Button from "@mui/material/Button"
import RedoRoundedIcon from '@mui/icons-material/RedoRounded';
import { CustomEventKeys } from "@misc";
import { useContext } from "react";
import Context from "@components/contexts";

const NextOrderBtn = () => {
    const {currentOrderID} = useContext(Context)
    const onClick = () => document.dispatchEvent(new CustomEvent(CustomEventKeys.NEXT_ORDER,{detail:{orderToDelete:currentOrderID}}))
    return (
        <Button
            variant="contained"
            sx={{fontSize:'1.4rem',letterSpacing:'0.3rem'}}
            startIcon={<RedoRoundedIcon sx={{scale:1.4,mr:2}} />}
            color='warning'
            onClick={onClick}
        >Next Order</Button>
    )
}

export default NextOrderBtn
import Drawer from "@mui/material/Drawer"
import OrderSummary from "./order-summary";
import Stack from "@mui/material/Stack";
import { useContext } from "react";
import { OrderNumberContext } from "../contexts";
import PrintReceiptBtn from "./print-receipt-btn";
import Notes from "./notes";
import Refund from "./refund";

const drawerWidth = 350;

const ActionsDrawer = () => {
    const {orderNumber} = useContext(OrderNumberContext)
    return (
        <Drawer
            variant="permanent"
            anchor="right"
            sx={{
                width: drawerWidth,
                flexShrink: 0,
                ['& .MuiDrawer-paper']: { width: drawerWidth, boxSizing: 'border-box', py:1 },
            }}
        >
            {!!orderNumber && <Stack direction='column' spacing={2}>
                <OrderSummary />
                <PrintReceiptBtn />
                <Notes />
                <Refund />
            </Stack>}
        </Drawer>
    )
}

export default ActionsDrawer
import Stack from "@mui/material/Stack"
import TableCell from "@mui/material/TableCell"
import Typography from "@mui/material/Typography"

const HeaderCell = (
    {
        title,
        amount
    }:{
        title:string;
        amount:string;
    }
) => (
    <TableCell>
        <Stack direction='row' justifyContent='space-between'>
            <Typography>{title}:</Typography>
            <Typography>{amount}</Typography>
        </Stack>
    </TableCell>
)

export default HeaderCell
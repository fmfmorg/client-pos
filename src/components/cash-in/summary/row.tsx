import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

const Row = (
    {
        name,
        amount
    }:{
        name:string;
        amount:string;
    }
) => (
    <Stack direction='row' sx={{justifyContent:'space-between',py:1}}>
        <Typography>{name}</Typography>
        <Typography>{amount}</Typography>
    </Stack>
)

export default Row
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import { ChangeEvent, useContext } from "react";
import { ProductTypeContext } from "../contexts";

const SelectSubTypeCheckbox = () => {
    const {selectSubTypes,updateSelectSubTypes} = useContext(ProductTypeContext)
    const onChange = (e:ChangeEvent<HTMLInputElement>) => updateSelectSubTypes(e.target.checked)
    return (
        <FormControlLabel 
            label='By Subtype'
            sx={{'.MuiFormControlLabel-label':{width:'max-content'}}}
            control={<Checkbox checked={selectSubTypes} onChange={onChange}  />}
        />
    )
}

export default SelectSubTypeCheckbox
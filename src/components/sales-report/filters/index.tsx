import { ProductTypeContext } from "../contexts";
import ProductSubTypeFilter from "./product-subtype-filter";
import ProductTypeFilter from "./product-type-filter";
import SelectSubTypeCheckbox from "./select-subtype-checkbox";

const Filters = () => (
    <ProductTypeContext.Consumer>{({selectSubTypes})=>(
        <>
        <SelectSubTypeCheckbox />
        {selectSubTypes ? <ProductSubTypeFilter /> : <ProductTypeFilter />}
        </>
    )}</ProductTypeContext.Consumer>
)

export default Filters
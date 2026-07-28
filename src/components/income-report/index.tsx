'use client'

import DateSelector from "../../misc/date-selector"
import IncomeTable from "./table"

const IncomeReport = () => {
    return (
        <DateSelector>
            <IncomeTable />
        </DateSelector>
    )
}

export default IncomeReport
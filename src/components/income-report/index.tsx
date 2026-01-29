'use client'

import DateSelector from "src/misc/date-selector"
import IncomeTable from "./table"

const IncomeReport = () => {
    return (
        <DateSelector>
            <IncomeTable />
        </DateSelector>
    )
}

export default IncomeReport
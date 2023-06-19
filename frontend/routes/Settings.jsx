import { TextField } from '@mui/material'
import React from 'react'
import DropdownList from "react-widgets/DropdownList"
import { useNavigate } from 'react-router-dom';
import { columns, findColumn } from '../columns';

export default function Settings() {

  const navigate = useNavigate()

  const [columnSelection, setColumnSelection] = React.useState("")
  const [matchComparatorSelection, setMatchComparatorSelection] = React.useState("")
  const [blacklist, setBlacklist] = React.useState(true)
  const [match, setMatch] = React.useState("")
  const [matchingProcess, setMatchingProcess] = React.useState([])

  const [filters, setFilters] = React.useState(() => {
    const localValue = localStorage.getItem("filters")
    if (localValue == null) return []
    return JSON.parse(localValue)
  })
  React.useEffect(() => {
    localStorage.setItem("filters", JSON.stringify(filters))
  }, [filters])

  function addFilter(filter) {
    setFilters([...filters, filter])
  }

  function setSelectedColumn(column) {
    setColumnSelection(column)
    setMatchingProcess(findColumn(column)["comparators"])
  }

  return (
    <>
      <button onClick={() => navigate("/")}>Feed</button>
      <div>
        Active Filters:

        {filters.map((filter, index) => (
          <div key={index} ><div key={index}>{
            (filter["blacklist"] ? "Blacklist" : "Whitelist") + ": " + filter["column"] + " " + filter["matchComparator"] + " " + filter["match"]}
            <button onClick={() => { setFilters([...filters.filter((curr, i) => i != index)]) }}>Delete</button>
          </div></div>
        ))}
      </div>

      Add filter rule to blacklist entries:

      < div style={{ display: 'flex' }} >

        <DropdownList
          value={blacklist ? "Blacklist" : "Whitelist"}
          data={["Blacklist", "Whitelist"]}
          placeholder='select what to block'
          onSelect={(selection) => setBlacklist(selection == "Blacklist")}
        />
        <DropdownList
          value={columnSelection}
          data={columns.filter((column) => column["comparators"].length > 0).map((column) => column["title"])}
          placeholder='select column'
          onSelect={(selection) => { setSelectedColumn(selection); setMatchComparatorSelection("") }}
        />
        <DropdownList
          value={matchComparatorSelection}
          data={matchingProcess}
          placeholder='select comparator'
          onSelect={(selection) => setMatchComparatorSelection(selection)} disabled={columnSelection == ""}
        />
        <TextField
          style={{ backgroundColor: "white", width: 500 }}
          value={match}
          placeholder='match'
          onChange={(event) => setMatch(event.target.value)}
        />

        <button onClick={() => {
          addFilter({
            "column": columnSelection,
            "matchComparator": matchComparatorSelection,
            "match": match,
            "blacklist": blacklist
          })
          setColumnSelection("")
          setMatchComparatorSelection("")
          setMatch("")
        }}>add Filter</button>
        <button onClick={() => {
          setFilters([])
        }}>delete all Filters</button>
      </div >
    </>



  )
}

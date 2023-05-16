import * as React from 'react';
import './App.css'
import RssTable from './RssTable'

export default function App() {

  const [rowsData, setRowsData] = React.useState(() => {
    const localValue = localStorage.getItem("ITEMS")
    if (localValue == null) return []
    return JSON.parse(localValue)
  })

  React.useEffect(() => {
    localStorage.setItem("ITEMS", JSON.stringify(rowsData))
  }, [rowsData])

  function addEntries(entries) {
    var newRowsData = [...rowsData, ...entries]
    setRowsData(newRowsData)
    console.log("Setting rowsData to ")
    console.log(newRowsData)
  }
  
  function deleteEntries() {
    setRowsData([])
    console.log("Setting rowsData to []")
  }

  return (
    <>
      <RssTable rowsData={rowsData} setRowsData={setRowsData} />
      <button onClick={() => addEntries([{ author: "this is a test", title: "does it work?", date: "2023-03-06T15:00:36+00:00" }])}>AddEntry</button>
      <button onClick={() => deleteEntries()}>Delete</button>
      <button onClick={() => console.log("test")}>Test</button>
    </>
  )
}

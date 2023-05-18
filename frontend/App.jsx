import * as React from 'react'
import './App.css'
import RssTable from './RssTable'
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels"
import IconExpansionTreeView from './IconExpansionTreeView';

export default function App() {

  const [treeData, setTreeData] = React.useState(() => [])

  React.useEffect(() => {
    var feedList
    fetch("http://localhost:3001/feedlist")
      .then((res) => res.json())
      .then((feeddata) => {
        feedList = feeddata
        console.log("feedList:")
        console.log(feedList)
        setTreeData(feedList)
      });
  }, [])

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

  function loadFeed() {
    //TODO handle clicking on folders
    //probably in backend

    fetch("http://localhost:3001/rss")
      .then((res) => res.json())
      .then((feeddata) => {

        var xml = feeddata

        const parser = new DOMParser()
        const doc = parser.parseFromString(xml, "text/xml")
        const errorNode = doc.querySelector("parsererror")
        if (errorNode) {
          console.log("error while parsing");
        } else {
          var entries = []
          var xmlEntries = doc.getElementsByTagName("entry")

          //show entries
          //console.log(xmlEntries)

          for (var i = 0; i < xmlEntries.length; i++) {
            var title = xmlEntries[i].children[3].textContent
            var url = xmlEntries[i].children[4].attributes["href"]
            var authorUrl = xmlEntries[i].children[5].children[1].textContent
            var author = xmlEntries[i].children[5].children[0].textContent
            var date = xmlEntries[i].children[6].textContent

            entries.push({ "author": author, "authorUrl": authorUrl, "title": title, "date": date, 'url': url.value })
          }
          setRowsData(entries)
        }
      });
  }


  return (
    <>
      <PanelGroup direction="horizontal" className='panelgroup'>
        <Panel defaultSize={20} minSize={20} className='panel sidebar'>
          <IconExpansionTreeView treeData={treeData}/>
        </Panel>
        <PanelResizeHandle className='panelResizeHandle' />
        <Panel minSize={30} className='panel'>

          <RssTable rowsData={rowsData} setRowsData={setRowsData} />
          <button onClick={() => addEntries([{ author: "this is a test", title: "does it work?", date: "2023-03-06T15:00:36+00:00" }])}>AddEntry</button>
          <button onClick={() => deleteEntries()}>Delete</button>
          <button onClick={() => loadFeed("Youtube/Bandoot")}>Test</button>
        </Panel>
      </PanelGroup>
    </>
  )
}

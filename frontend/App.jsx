import * as React from 'react';
import './App.css'
import RssTable from './RssTable'
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
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

  function xmlParseSingleFeed(feeddata){
    const parser = new DOMParser()
    const doc = parser.parseFromString(feeddata, "text/xml")
    const errorNode = doc.querySelector("parsererror")
    if (errorNode) {
      console.log("error while parsing");
    } else {
      var entries = []
      var xmlEntries = doc.getElementsByTagName("entry")

      //console.log(xmlEntries)

      for (var i = 0; i < xmlEntries.length; i++) {
        var title = xmlEntries[i].children[3].textContent
        var url = xmlEntries[i].children[4].attributes["href"]
        var authorUrl = xmlEntries[i].children[5].children[1].textContent
        var author = xmlEntries[i].children[5].children[0].textContent
        var date = xmlEntries[i].children[6].textContent

        entries.push({ "author": author, "authorUrl": authorUrl, "title": title, "date": date, 'url': url.value })
      }
      return entries
    }
  }


  function loadFeed(feedname) {
    console.log(feedname)

    fetch("http://localhost:3001/rss?feed=" + feedname)
      .then((res) => res.json())
      .then((feeddata) => {

        var newEntries = []
        console.log(typeof (feeddata))
        if (typeof (feeddata) == "string") {
          newEntries = xmlParseSingleFeed(feeddata)
        }else if(typeof(feeddata) == "object"){
          console.log(feeddata.length)
          for(var i = 0; i < feeddata.length; i++){
            newEntries = [...newEntries, ...xmlParseSingleFeed(feeddata[i])]
          }
        }

        setRowsData(newEntries)
      });
  }



  return (

    <>
      <PanelGroup direction="horizontal" className='panelgroup'>
        <Panel defaultSize={20} minSize={20} className='panel sidebar'>
          <IconExpansionTreeView treeData={treeData} onTreeSelection={loadFeed} />
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
import * as React from 'react';
import '../App.css'
import "react-widgets/styles.css";
import RssTable from '../RssTable'
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import IconExpansionTreeView, { findNode } from '../IconExpansionTreeView';
import { hasFeedCached, addFeedToCache, getFeedFromCache, loadFeedCache, updateSeenStatusInCache } from "../localCaching";
import { checkFilters } from '../filteringMatchFunction'
import { useNavigate } from 'react-router-dom';

const serverAddress = "localhost"
const serverPort = 3001


export default function MainPage() {
  
  const navigate = useNavigate();

  //rowdata
  const [rowsData, setRowsData] = React.useState(() => {
    const localValue = localStorage.getItem("ITEMS")
    if (localValue == null) return []
    return JSON.parse(localValue)
  })
  React.useEffect(() => {
    localStorage.setItem("ITEMS", JSON.stringify(rowsData))
  }, [rowsData])

  //filtering
  const [filteredRowsData, setFilteredRowsData] = React.useState([])

  const [filters, setFilters] = React.useState(() => {
    const localValue = localStorage.getItem("filters")
    if (localValue == null) return []
    return JSON.parse(localValue)
  })
  React.useEffect(() => {
    var filtered = rowsData.filter(row => checkFilters(row, filters))
    console.log("Filtering removed " + (rowsData.length - filtered.length) + " entries")
    setFilteredRowsData(filtered)
  }, [rowsData])

  //treeview
  const [selectedTreeElement, setSelectedTreeElement] = React.useState({})

  const [treeData, setTreeData] = React.useState(() => {
    const localValue = localStorage.getItem("treeData")
    if (localValue == null) return []
    return JSON.parse(localValue)
  })
  React.useEffect(() => {
    localStorage.setItem("treeData", JSON.stringify(treeData))
  }, [treeData])

  React.useEffect(() => {
    fetch("http://" + serverAddress + ":" + serverPort + "/feedlist")
      .then((res) => res.json())
      .then((feedlist) => {
        // console.log("feedList:")
        // console.log(feedlist)
        setTreeData(feedlist)
      });

    loadFeedCache()

  }, [])


  async function loadFeed(feedname, bypassCache) {
    console.log("loadFeed: " + feedname)

    if (hasFeedCached(feedname) && !bypassCache) {
      console.log("Showing Cached feed")
      return getFeedFromCache(feedname)
    } else {
      return fetch("http://" + serverAddress + ":" + serverPort + "/rss?feed=" + encodeURIComponent(feedname))
        .then((res) => res.json())
        .then((feeddata) => {
          var newEntries = feeddata

          newEntries.sort(function (entry1, entry2) {
            const date1 = new Date(entry1["date"])
            const date2 = new Date(entry2["date"])
            return date2 - date1
          })
          addFeedToCache(feedname, newEntries)
          return newEntries
        });
    }
  }

  async function loadFolder(nodeId, currentPath, bypassCache) {
    var feedEntries = []
    var children = findNode(nodeId, treeData).children
    for (var i = 0; i < children.length; i++) {
      feedEntries.push(...await loadFeedOrFolder(children[i].nodeId, currentPath + "/" + children[i].label, bypassCache))
    }
    return feedEntries
  }

  async function onTreeElementClick(nodeId, currentPath, bypassCache = false) {
    setSelectedTreeElement({ "nodeId": nodeId, "currentPath": currentPath })
    console.log("Clicked on", currentPath)
    console.log(rowsData)

    var feedEntries = await loadFeedOrFolder(nodeId, currentPath, bypassCache)
    setRowsData(feedEntries)
  }

  async function loadFeedOrFolder(nodeId, currentPath, bypassCache) {
    var feedEntries = []
    var children = findNode(nodeId, treeData).children
    if (children !== undefined) {
      // console.log(currentPath + " is a folder")
      feedEntries = await loadFolder(nodeId, currentPath, bypassCache)

    } else {
      // console.log(currentPath + " is a feed")
      feedEntries = await loadFeed(currentPath, bypassCache)
    }

    feedEntries.sort(function (entry1, entry2) {
      const date1 = new Date(entry1["date"])
      const date2 = new Date(entry2["date"])
      return date2 - date1
    })

    return feedEntries
  }

  function setSeenInRowsData(rowIndices, seenStatus) {
    const rowsCopy = [...rowsData]
    for (var i = 0; i < rowIndices.length; i++) {
      rowsCopy[rowIndices[i]]["seen"] = seenStatus
    }
    setRowsData(rowsCopy)
  }

  function onSeenClick(rowUrl, seenStatus, update = true) {

    const rowIndex = rowsData.findIndex(row => row["url"] == rowUrl)

    //update in backend
    const fetchUrl = "http://" + serverAddress + ":" + serverPort + "/setSeen?url=" + filteredRowsData[rowIndex].url + "&seen=" + (seenStatus ? 1 : 0)
    fetch(fetchUrl)
      .then((res) => res.json())
      .then((answer) => {
        console.log(answer["message"])
      })

    //update in dom
    if (update) {
      setSeenInRowsData([rowIndex], seenStatus)
    }

    //update in cache
    const currentPath = selectedTreeElement["currentPath"]
    updateSeenStatusInCache(currentPath, filteredRowsData[rowIndex].url, seenStatus)



  }

  function markAllRead() {
    const markSeen = true
    const allRows = [...Array(rowsData.length).keys()]
    console.log(allRows)
    for (var i = 0; i < allRows.length; i++) {
      onSeenClick(i, markSeen, false)
    }
    setSeenInRowsData(allRows, markSeen)
  }

  return (
    <PanelGroup direction="horizontal" className='panelgroup' style={{ width: "92vw", overflow: "scroll" }}>

      <Panel classname="panel" defaultSize={20}>
        <div style={{ height: "90vh", overflow: "auto" }}>
          <div>
            <button onClick={() => {
              filteredRowsData[0].seen = !filteredRowsData[0].seen
              console.log(rowsData[0].seen)
            }}>Test</button>
            <button onClick={() => onTreeElementClick(selectedTreeElement["nodeId"], selectedTreeElement["currentPath"], true)}>Update Feed</button>
            <button onClick={() => markAllRead()}>Mark all Read</button>
            <button onClick={() => navigate("/settings")}>Filter Settings</button>
          </div>
          {/* <button onClick={() => console.log(loadFeedEntries("Youtube/Felixba", true))}>bla</button> */}
          <div>
            <IconExpansionTreeView treeData={treeData} onClick={onTreeElementClick} />
          </div>
        </div>
      </Panel>
      <PanelResizeHandle className='panelResizeHandle' />
      <Panel className="panel">
        <RssTable filteredRowsData={filteredRowsData} onSeenClick={onSeenClick} />
      </Panel>
    </PanelGroup>
  )
}
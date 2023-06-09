import * as React from 'react';
import '../App.css'
import "react-widgets/styles.css";
import RssTable from '../RssTable'
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import IconExpansionTreeView, { findNode } from '../IconExpansionTreeView';
import { hasFeedCached, addFeedToCache, getFeedFromCache, loadFeedCache, updateSeenStatusInCache } from "../localCaching";
import { checkFilters } from '../filteringMatchFunction'
import { useNavigate } from 'react-router-dom';

const serverAddress = window.location.hostname
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
  const [selectedTreeElement, setSelectedTreeElement] = React.useState(() => {
    const localValue = localStorage.getItem("selectedTreeElement")
    if (localValue == null) return "0"
    return JSON.parse(localValue)
  })
  React.useEffect(() => {
    localStorage.setItem("selectedTreeElement", JSON.stringify(selectedTreeElement))
  }, [selectedTreeElement])

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

  function onSeenClick(rowUrl, seenStatus) {

    const rowIndex = rowsData.findIndex(row => row["url"] == rowUrl)

    //update in backend
    const fetchUrl = "http://" + serverAddress + ":" + serverPort + "/setSeen?url=" + rowsData[rowIndex].url + "&seen=" + (seenStatus ? 1 : 0)
    fetch(fetchUrl, { method: "POST" })

    //update in dom
    const rowsDataCopy = [...rowsData]
    rowsDataCopy[rowIndex]["seen"] = seenStatus
    setRowsData(rowsDataCopy)

    //update in cache
    const currentPath = selectedTreeElement["currentPath"]
    updateSeenStatusInCache(currentPath, rowsData[rowIndex].url, seenStatus)
  }

  function markAllRead() {
    var shownUrls = filteredRowsData.map((row) => row["url"])
    shownUrls = shownUrls.filter((entry) => entry["seen"] != 1)

    //update in backend
    const fetchUrl = "http://" + serverAddress + ":" + serverPort + "/setMultipleSeen"
    fetch(fetchUrl, {
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      mods: "cors",
      body: JSON.stringify(
        shownUrls.map((url) => ({
          "url": url,
          "seen": true
        })))
    })

    //update in rowsData
    const rowsDataCopy = [...rowsData]
    for (var i = 0; i < rowsData.length; i++) {
      if (shownUrls.includes(rowsData[i]["url"])) {
        rowsDataCopy[i]["seen"] = true
      }
    }
    setRowsData(rowsDataCopy)

    //update in cache
    const currentPath = selectedTreeElement["currentPath"]
    for (var urlIndex in shownUrls) {
      updateSeenStatusInCache(currentPath, shownUrls[urlIndex], true)
    }
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
            <IconExpansionTreeView treeData={treeData} onClick={onTreeElementClick} selectedTreeElement={selectedTreeElement} setSelectedTreeElement={setSelectedTreeElement} />
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
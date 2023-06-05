import * as React from 'react';
import './App.css'
import RssTable from './RssTable'
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import IconExpansionTreeView, { findNode } from './IconExpansionTreeView';
import { hasFeedCached, addFeedToCache, getFeedFromCache, loadFeedCache } from "./localCaching";

export default function App() {

  const [selectedTreeElement, setSelectedTreeElement] = React.useState({})

  const [treeData, setTreeData] = React.useState(() => [])

  React.useEffect(() => {
    fetch("http://localhost:3001/feedlist")
      .then((res) => res.json())
      .then((feedlist) => {
        // console.log("feedList:")
        // console.log(feedlist)
        setTreeData(feedlist)
      });

    loadFeedCache()

  }, [])

  const [rowsData, setRowsData] = React.useState(() => {
    const localValue = localStorage.getItem("ITEMS")
    if (localValue == null) return []
    return JSON.parse(localValue)
  })

  React.useEffect(() => {
    localStorage.setItem("ITEMS", JSON.stringify(rowsData))
  }, [rowsData])

  function xmlParseSingleFeed(feeddata) {
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

  async function loadFeedEntries(feedname, bypassCache) {
    console.log("loadFeed: " + feedname)

    if (hasFeedCached(feedname) && !bypassCache) {
      console.log("Showing Cached feed")
      return getFeedFromCache(feedname)
    } else {
      console.log("fetching")
      return fetch("http://localhost:3001/rss?feed=" + feedname)
        .then((res) => res.json())
        .then((feeddata) => {
          var newEntries = []

          //single feed
          console.log("typeof feeddata", typeof (feeddata))
          if (typeof (feeddata) == "string") {
            console.log("single feed")
            newEntries = xmlParseSingleFeed(feeddata)
          }

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

  async function loadSingleFeed(feedname, bypassCache = false) {
    var feedEntries = await loadFeedEntries(feedname, bypassCache)

    feedEntries.sort(function (entry1, entry2) {
      const date1 = new Date(entry1["date"])
      const date2 = new Date(entry2["date"])
      return date2 - date1
    })
    setRowsData(feedEntries)
  }

  async function loadMultipleFeeds(feednames, bypassCache) {
    var newEntries = []
    for (var i = 0; i < feednames.length; i++) {

      //TODO load in background
      newEntries.push(...await loadFeedEntries(feednames[i], bypassCache))
    }

    newEntries.sort(function (entry1, entry2) {
      const date1 = new Date(entry1["date"])
      const date2 = new Date(entry2["date"])
      return date2 - date1
    })
    setRowsData(newEntries)


  }

  function loadFeedOrFolder(nodeId, currentPath, bypassCache = false) {
    setSelectedTreeElement({ "nodeId": nodeId, "currentPath": currentPath })
    console.log("test")

    var children = findNode(nodeId, treeData).children
    if (children !== undefined) { //clicked on a folder
      loadMultipleFeeds(children.map(function (child) {
        return currentPath + "/" + child.label
      }), bypassCache)
    } else {  //clicked on a feed
      console.log("feed")
      loadSingleFeed(currentPath, bypassCache)
    }
  }

  return (
    <>
      <PanelGroup direction="horizontal" className='panelgroup'>
        <Panel defaultSize={20} minSize={20} className='panel sidebar'>
          <button onClick={() => console.log(getFeedFromCache("Youtube/Techquickie"))}>Test</button>
          <button onClick={() => loadFeedOrFolder(selectedTreeElement["nodeId"], selectedTreeElement["currentPath"], true)}>Update Feed</button>
          {/* <button onClick={() => console.log(loadFeedEntries("Youtube/Felixba", true))}>bla</button> */}
          <IconExpansionTreeView treeData={treeData} onClick={loadFeedOrFolder} />
        </Panel>
        <PanelResizeHandle className='panelResizeHandle' />
        <Panel minSize={30} className='panel'>
          <RssTable rowsData={rowsData} />
        </Panel>
      </PanelGroup>
    </>
  )
}
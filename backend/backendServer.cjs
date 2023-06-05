const express = require("express");
const PORT = process.env.PORT || 3001;
const app = express();

const opmlReader = require('./opmlReader.cjs');

var feedList = []
var lastAccessTime = []

function findFeedsInFolder(feedObject, feedsInFolder = []) {

  if (Object.hasOwn(feedObject, "xmlUrl")) {
    feedsInFolder.push(feedObject["xmlUrl"])
  }

  if (Object.hasOwn(feedObject, "children")) {
    for (var i = 0; i < feedObject["children"].length; i++) {
      feedsInFolder = [...feedsInFolder, ...findFeedsInFolder(feedObject["children"][i])]
    }
  }

  return feedsInFolder
}

function findFeed(feedPath, inData) {
  //feedPath looks like this: Folder/Subfolder/Feed
  var pathLevelSeperatorPosition = feedPath.indexOf("/") > -1 ? feedPath.indexOf("/") : feedPath.length
  var pathLevel = feedPath.slice(0, pathLevelSeperatorPosition)
  var remainingPath = feedPath.slice(pathLevelSeperatorPosition + 1)

  for (var i = 0; i < inData.length; i++) {
    if (inData[i].label == pathLevel) {
      if (remainingPath === "") {
        return inData[i]
      }
      return findFeed(remainingPath, inData[i].children)
    }
  }

  return inData
}

async function getFromUrls(urls){
  if(urls.length > 0){
    console.log(urls.length + " remaining")
    // console.log(urls[0])
    var feed = await getDataFromCacheOrUrl(urls[0])

    await new Promise(r => setTimeout(r, 10))
    urls.splice(0, 1)
    return  [feed, ...(await getFromUrls(urls))]
  }else{
    return []
  }

}

async function getFromUrl(url){
  var content = fetch(url)
  .then((response) => response.text())
  .then((text) => {
    lastAccessTime[url] = {"time": new Date(), "content": text}
    return text
  });
  return await content
}

function recentCacheAvailable(xmlUrl){
  if(Object.hasOwn(lastAccessTime, xmlUrl)){
    const currentTime = new Date()
    const timeDifference = Math.abs(currentTime - lastAccessTime[xmlUrl]["time"])
    const minutes = Math.floor((timeDifference/1000)/60);

    if(minutes < 30){
      console.log("found cached data from " + minutes + " minutes ago")
      return true
    }else{
      console.log("cached data found but it is " + minutes + " minutes old")
      return false
    }
  }
}

async function getDataFromCacheOrUrl(url){
  if(recentCacheAvailable(url)){
    console.log("Responding with cached data")
    return lastAccessTime[url]["content"]
  }else{
    console.log("Fetching data from " + url)
    var feed = getFromUrl(url)
    console.log("Responding with fetched data")
    return await feed
  }
}

app.get("/rss", async (req, res) => {
  console.log("-------------------------")
  console.log("Responding to " + req.url)
  var feedPath = req.query.feed

  console.log("Getting Feed for " + feedPath)
  var feedObject = findFeed(feedPath, feedList)

  //single feed
  if (Object.hasOwn(feedObject, "xmlUrl")) {
    var xmlUrl = feedObject["xmlUrl"]
    var data = await getDataFromCacheOrUrl(xmlUrl)
    res.json(data)

    //folder of feeds
  } else {
    var xmlUrls = findFeedsInFolder(feedObject)
    var allFeeds = await getFromUrls(xmlUrls)
    console.log(allFeeds.length)
    res.json(allFeeds)
  }
});

app.get("/feedlist", (req, res) => {
  console.log("Responding to " + req.url)
  res.json(feedList)
});

app.get("/api", (req, res) => {
  console.log("Responding to " + req.url)
  res.json({ message: "Hello from server!" });
});

app.listen(PORT, () => {
  feedList = opmlReader.createFeedsList()
  console.log(`Server listening on ${PORT}`);
});

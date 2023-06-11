const express = require("express");
const PORT = process.env.PORT || 3001;
const app = express();

const util = require('util')
var parseXmlString = require('xml2js').parseString;
const opmlReader = require('./opmlReader.cjs');
const database = require('./database.cjs');

var feedList = []
var cache = []

function xmlParseSingleFeed(feeddata) {

  var parsed
  parseXmlString(feeddata, (err, res) => {
    if (err) parsed = { "message": "could not parse xml" }
    else {
      var entries = []
      var xmlEntries = res["feed"]["entry"]
      // console.log(util.inspect(res, false, null))

      for (var i = 0; i < xmlEntries.length; i++) {
        var title = xmlEntries[i]["title"][0]
        var url = xmlEntries[i]["link"][0]["$"]["href"]
        var authorUrl = xmlEntries[i]["author"][0]["uri"][0]
        var author = xmlEntries[i]["author"][0]["name"][0]
        var date = xmlEntries[i]["published"][0]
        var seen = database.getSeen(url)
        entries.push({ "author": author, "authorUrl": authorUrl, "title": title, "date": date, 'url': url, "seen": seen })
      }
      parsed = entries
    }

  })
  return parsed
}

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

async function getFromUrls(urls) {
  if (urls.length > 0) {
    console.log(urls.length + " remaining")
    // console.log(urls[0])
    var feed = await getDataFromCacheOrUrl(urls[0])

    await new Promise(r => setTimeout(r, 10))
    urls.splice(0, 1)
    return [feed, ...(await getFromUrls(urls))]
  } else {
    return []
  }
}

async function getFromUrl(url) {
  var entries = fetch(url)
    .then((response) => response.text())
    .then((text) => {

      var parsed = xmlParseSingleFeed(text)

      cache[url] = { "time": new Date(), "entries": parsed }
      return parsed
    });
  return await entries
}

function recentCacheAvailable(xmlUrl) {
  if (Object.hasOwn(cache, xmlUrl)) {
    const currentTime = new Date()
    const timeDifference = Math.abs(currentTime - cache[xmlUrl]["time"])
    const minutes = Math.floor((timeDifference / 1000) / 60);

    if (minutes < 30) {
      console.log("found cached data from " + minutes + " minutes ago")
      return true
    } else {
      console.log("cached data found but it is " + minutes + " minutes old")
      return false
    }
  }
}

async function getDataFromCacheOrUrl(url) {
  if (recentCacheAvailable(url)) {
    console.log("Responding with cached data")
    return cache[url]["entries"]
  } else {
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
    var parsedFeed = await getDataFromCacheOrUrl(xmlUrl)

    res.json(parsedFeed)

    //folder of feeds
  } else {
    var xmlUrls = findFeedsInFolder(feedObject)
    var allFeeds = await getFromUrls(xmlUrls)
    console.log(allFeeds)
    res.json({ "xml": allFeeds })
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

app.get("/getSeen", (req, res) => {
  console.log("Responding to " + req.url)
  var url = req.query.url
  var result = database.getSeen(url)
  res.json({ message: result });
});

app.get("/setSeen", (req, res) => {
  console.log("Responding to " + req.url)
  var url = req.query.url
  var seen = req.query.seen
  var result = database.setSeen(url, seen)

  const keys = Object.keys(cache)
  for (var cacheIndex = 0; cacheIndex < keys.length; cacheIndex++) {
    const cacheEntry = cache[keys[cacheIndex]]
    for (var entryIndex = 0; entryIndex < cacheEntry["entries"].length; entryIndex++) {
      const entry = cacheEntry["entries"][entryIndex]
      if (entry["url"] == url) {
        console.log("updated seenStatus for " + url + " to " + seen)
        entry["seen"] = seen
      }
    }
  }

  res.json({ message: result });
});


app.listen(PORT, () => {
  feedList = opmlReader.createFeedsList()

  console.log(`Server listening on ${PORT}`);
});

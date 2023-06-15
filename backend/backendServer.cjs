const express = require("express");
const PORT = process.env.PORT || 3001;
const app = express();
const tinyduration = require('tinyduration');

const util = require('util')
var parseXmlString = require('xml2js').parseString;
const opmlReader = require('./opmlReader.cjs');
const database = require('./database.cjs');
const { YOUTUBE_API_KEY } = require("../youtubeApiKey.cjs");
const dateFormattingConfig = require("../dateFormattingConfig.cjs");

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

async function getFromUrls(urls, disableOutput) {
  if (urls.length > 0) {
    console.log(urls.length + " remaining")
    // console.log(urls[0])
    var feed = await getDataFromCacheOrUrl(urls[0], disableOutput)

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

function recentCacheAvailable(xmlUrl, disableOutput = false) {
  if (Object.hasOwn(cache, xmlUrl)) {
    const currentTime = new Date()
    const timeDifference = Math.abs(currentTime - cache[xmlUrl]["time"])
    const minutes = Math.floor((timeDifference / 1000) / 60);

    if (minutes < 30) {
      if (!disableOutput) console.log("found cached data from " + minutes + " minutes ago")
      return true
    } else {
      if (!disableOutput) console.log("cached data found but it is " + minutes + " minutes old")
      return false
    }
  }
}

function getSubFeedPaths(feed, currentPath = "") {
  var subfeeds = []

  if (Object.hasOwn(feed, "children")) { //is folder
    for (var i = 0; i < feed.children.length; i++) {
      subfeeds.push(...getSubFeedPaths(feed.children[i], currentPath + feed.label + "/"))
    }
  } else { //is feed
    subfeeds.push(currentPath + feed.label)
  }
  return subfeeds
}

async function getDataFromCacheOrUrl(url, disableOutput) {
  if (recentCacheAvailable(url, disableOutput)) {
    if (!disableOutput) console.log("Responding with cached data")
    return cache[url]["entries"]
  } else {
    if (!disableOutput) console.log("Fetching data from " + url)
    var feed = getFromUrl(url)
    if (!disableOutput) console.log("Responding with fetched data")
    return await feed
  }
}

async function getVideoDetails(videoIds) {

  if (!YOUTUBE_API_KEY) {
    throw new Error("No API key is provided");
  } else {
    const items = []

    do { //youtube api call can only handle 50 ids at a time
      const currentPassEnd = videoIds.length > 50 ? 50 : videoIds.length
      const currentBatch = videoIds.slice(0, currentPassEnd)
      videoIds = videoIds.slice(currentPassEnd)

      const idList = currentBatch.map((id) => "&id=" + id).join("")
      const url = "https://www.googleapis.com/youtube/v3/videos?part=contentDetails&key=" + YOUTUBE_API_KEY + idList;

      await fetch(url)
        .then((response) => response.json())
        .then((content) => {
          items.push(...content["items"])
        });
    } while (videoIds.length > 0)

    return items
  }
}

async function getVideoDurations(videoIds) {
  const videos = await getVideoDetails(videoIds)
  const durations = []

  for (var i = 0; i < videos.length; i++) {
    const duration = tinyduration.parse(videos[i]["contentDetails"]["duration"])
    var seconds = 0
    if (duration.hours != undefined) {
      seconds = seconds + (parseInt(duration.hours) * 60 * 60)
    }
    if (duration.minutes != undefined) {
      seconds = seconds + (parseInt(duration.minutes) * 60)
    }
    if (duration.seconds != undefined) {
      seconds = seconds + parseInt(duration.seconds)
    }
    durations.push(seconds)
  }
  return durations
}

async function getRss(feedPath, disableOutput = false) {
  var feedObject = findFeed(feedPath, feedList)

  //single feed
  if (Object.hasOwn(feedObject, "xmlUrl")) {
    var xmlUrl = feedObject["xmlUrl"]
    var parsedFeed = await getDataFromCacheOrUrl(xmlUrl, disableOutput)
    return parsedFeed

    //folder of feeds
  } else {
    var xmlUrls = findFeedsInFolder(feedObject)
    var allFeeds = await getFromUrls(xmlUrls, disableOutput)
    return { "xml": allFeeds }
  }

}

async function updateAllFeeds() {
  console.log("Updating all Feeds...")
  const allFeeds = getSubFeedPaths(feedList[0])
  for (var i = 0; i < allFeeds.length; i++) {
    await getRss(allFeeds[i], true)
  }
  console.log("finished updating all feeds at " + new Date(Date.now()).toLocaleString(dateFormattingConfig.locale, dateFormattingConfig.dateFormatParam))
}

app.get("/updateAllFeeds", async (req, res) => {
  console.log("Responding to " + req.url)
  await updateAllFeeds()
  res.json({ "message": "all feeds updated successfully" })
});

app.get("/rss", async (req, res) => {
  console.log("-------------------------")
  console.log("Responding to " + req.url)
  var feedPath = req.query.feed

  const rss = await getRss(feedPath)

  res.json(rss)

});

app.get("/feedlist", (req, res) => {
  console.log("Responding to " + req.url)
  res.json(feedList)
});

app.get("/api", (req, res) => {
  console.log("Responding to " + req.url)
  res.json({ message: "Hello from server!" });
});


app.get("/test", async (req, res) => {

  const videoIds = ["2u3ujFhxEug", "dYktvWb0zaA"]
  const durations = await getVideoDurations(videoIds)

  res.json(durations);
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


app.listen(PORT, async () => {
  feedList = opmlReader.createFeedsList()

  await updateAllFeeds()
  setInterval(updateAllFeeds, 1000 * 60 * 60); //update every hour

  console.log(`Server listening on ${PORT}`);
});

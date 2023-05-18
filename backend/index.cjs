const express = require("express");
const PORT = process.env.PORT || 3001;
const app = express();

const opmlReader = require('./opmlReader.cjs');

var feeds = []

function findFeedsInFolder(feedObject, xmlUrls = []) {

  if (Object.hasOwn(feedObject, "xmlUrl")) {
    xmlUrls.push(feedObject["xmlUrl"])
  }

  if (Object.hasOwn(feedObject, "children")) {
    for (var i = 0; i < feedObject["children"].length; i++) {
      xmlUrls = [...xmlUrls, ...findFeedsInFolder(feedObject["children"][i])]
    }
  }

  return xmlUrls
}

function findFeed(feedPath, inData) {
  //feedPath looks like this: Folder/Feed
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



async function waitForNextUrl(urls){

  if(urls.length > 0){
    console.log(urls.length + " remaining")
    // console.log(urls[0])
    var feed = fetch(urls[0])
    .then((response) => response.text())
    .then((text) => {
      return text
    });

    await new Promise(r => setTimeout(r, 10))
    urls.splice(0, 1)
    return  [await feed, ...(await waitForNextUrl(urls))]
  }else{
    return []
  }
  
}


app.get("/rss", async (req, res) => {
  console.log("Responding to " + req.url)
  var feedPath = req.query.feed
  console.log("Getting Feed for " + feedPath)

  var feedObject = findFeed(feedPath, feeds)

  //single feed
  if (Object.hasOwn(feedObject, "xmlUrl")) {
    var xmlUrl = feedObject["xmlUrl"]
    fetch(xmlUrl)
      .then((response) => response.text())
      .then((text) => {
        res.json(text)
      });

    //folder of feeds
  } else {
    var xmlUrls = findFeedsInFolder(feedObject)

    var allFeeds = await waitForNextUrl(xmlUrls)
    res.json(allFeeds)

    console.log(allFeeds.length)

  }



});

app.get("/feedlist", (req, res) => {
  console.log("Responding to " + req.url)
  res.json(feeds)
});

app.get("/api", (req, res) => {
  console.log("Responding to " + req.url)
  res.json({ message: "Hello from server!" });
});

app.listen(PORT, () => {

  feeds = opmlReader.createFeedsDict()

  console.log(`Server listening on ${PORT}`);
});

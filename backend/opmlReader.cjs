const xml2js = require('xml2js');
const fs = require('fs');
const parser = new xml2js.Parser({ attrkey: "ATTR" });

var currentNodeId = -1
function processFeed(remainingFeedsObject, parentId) {
    var title = remainingFeedsObject["ATTR"]["title"]
    var text = remainingFeedsObject["ATTR"]["text"]
    var type = remainingFeedsObject["ATTR"]["type"]
    var xmlUrl = remainingFeedsObject["ATTR"]["xmlUrl"]
    var htmlUrl = remainingFeedsObject["ATTR"]["htmlUrl"]
    return {
        "nodeId": currentNodeId + "", "label": title, "xmlUrl": xmlUrl,
        "htmlUrl": htmlUrl, "parentId": parentId + ""
    }
}

function processFolder(remainingFeedsObject, parentId) {
    var title = remainingFeedsObject["ATTR"]["title"]
    var children = []
    var folderId = currentNodeId
    for (var i = 0; i < remainingFeedsObject["outline"].length; i++) {
        children.push(selectOperation(remainingFeedsObject["outline"][i], folderId))
    }
    return { "nodeId": folderId + "", "label": title, "parentId": parentId + "", "children": children }
}

function selectOperation(remainingFeedsObject, parentId = "root") {
    currentNodeId++
    if (!Object.hasOwn(remainingFeedsObject["ATTR"], "xmlUrl")) {
        return processFolder(remainingFeedsObject, parentId)
    } else {
        return processFeed(remainingFeedsObject, parentId)
    }
}

function createFeedsList() {

    var feedsObject = readOPML()
    //console.log(util.inspect(feedsObject, false, null))

    console.log("Generating FeedsDict...")
    var feeds = []
    currentNodeId = -1
    for (var i = 0; i < feedsObject.length; i++) {
        feeds.push(selectOperation(feedsObject[i]))
    }
    //console.log(util.inspect(feed, false, null))
    return feeds
}

function readOPML() {
    let file = fs.readFileSync("./subscriptions.opml", "utf8");
    var opmlBody

    parser.parseString(file, (error, result) => {
        if (error === null) {
            //console.log(util.inspect(result["opml"]["body"][0]["outline"], false, null))
            opmlBody = result["opml"]["body"][0]["outline"]
        }
        else {
            console.log(error);
        }
    });
    return opmlBody
}


module.exports = {
    createFeedsList
}
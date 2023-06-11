var cache = {}

export function loadFeedCache() {
    const data = localStorage.getItem("Feedcache")
    if (data !== null) {
        cache = JSON.parse(data)
        console.log("loading ", data, " into cache")
    } else {
        cache = {}
    }
}

export function addFeedToCache(feedname, feedEntries) {
    //TODO using feedname as key is bad, entries have to be saved in their feed and for each folder they are in seperatly
    //this also causes the need to "update feed" from backend to sync their "seen" status
    cache[feedname] = { data: feedEntries, time: new Date() }
    localStorage.setItem("Feedcache", JSON.stringify(cache))
}

export function hasFeedCached(feedname) {
    if (Object.hasOwn(cache, feedname)) {
        return true
    } else {
        return false
    }
}

export function updateSeenStatusInCache(path, searchUrl, seenStatus) {
    if (hasFeedCached(path)) {
        for (var i = 0; i < cache[path]["data"].length; i++) {
            if (cache[path]["data"][i].url == searchUrl) {
                cache[path]["data"][i].seen = seenStatus
            }
        }
        localStorage.setItem("Feedcache", JSON.stringify(cache))
    }
}

export function getFeedFromCache(feedname) {
    return cache[feedname].data
}
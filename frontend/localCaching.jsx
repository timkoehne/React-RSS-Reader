var cache = {}

export function loadFeedCache() {
    const data = localStorage.getItem("Feedcache")
    if (data !== null) {
        cache =  JSON.parse(data)
        console.log("loading ", data, " into cache")
    }else{
        cache = {}
    }
}

export function addFeedToCache(feedname, feedEntries) {
    cache[feedname] = {data: feedEntries, time: new Date()}
    localStorage.setItem("Feedcache", JSON.stringify(cache))
}

export function hasFeedCached(feedname){
    if(Object.hasOwn(cache, feedname)){
        return true
    }else{
        return false
    }
}

export function getFeedFromCache(feedname){
    // console.log("cache:")
    // console.log(feeddata)
    return cache[feedname].data
}
# React Rss-Reader
local Rss-Reader-Aggregator with react frontend and nodejs backend

i mainly use this to replace youtube subscriptions


# Todo
- add "all feeds" parent folder
- filtering: temporary and permanently
    - only show unread entries
    - remove youtube shorts
    - filter based on title or text content
- add video duration to youtube video feed entries in backend
- add youtube views and like numbers
- youtube-dislike api
- preview article / description
- embed target website
- multiple views
- improve ui
- change "mark all read" to batch process all entries at once
- fix frontend caching 
    - currentPath is dict key
    - results in parentfolders not caching on child updates
- make treeview not highlightable
- improve rsstable cell definition
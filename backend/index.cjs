
const express = require("express");
const PORT = process.env.PORT || 3001;
const app = express();

const opmlReader = require('./opmlReader.cjs');

var feeds = []

app.get("/rss", (req, res) => {
  console.log("Responding to " + req.url)
    var feed = "https://www.youtube.com/feeds/videos.xml?channel_id=UC2C_jShtL725hvbm1arSV9w"

  fetch(feed)
    .then((response) => response.text())
    .then((text) => {

      res.json(text)
    });
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

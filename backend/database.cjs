var Database = require('better-sqlite3');
var db = new Database('videos.db');

function isInDatabaseAndHasDuration(url) {
    const row = db.prepare(/*sql */`select duration from video where url=?`).get(url)
    if (row) {
        return true
    } else {
        return false
    }
}

function setDurationOrInsert(url, seen, duration) {
    const res = db.prepare(/*sql */`update video set duration = ? where url = ?`).run(duration, url)
    if (res && res.changes === 1) {
        return "success"
    } else {
        return insertRow(url, seen, duration)
    }
}

function insertRow(url, seen, duration) {
    const insert = db.prepare(/*sql */`insert into video(url, seen, duration) values (?, ?, ?)`).run(url, seen, duration)
    if (insert && insert.changes === 1) {
        return "success"
    } else {
        console.log("could not insert " + url + " into database")
        return "failed"
    }
}

function getNumberOfRows() {
    const num = db.prepare(/*sql */`select count(*) from video`).get()
    if (num) {
        return num["count(*)"]
    } else {
        return 0
    }
}

function getSeen(url) {
    const row = db.prepare(/*sql */`select * from video where url=?`).get(url)
    if (row) {
        return row.seen
    } else {
        return 0
    }
}
function getDuration(url) {
    const row = db.prepare(/*sql */`select * from video where url=?`).get(url)
    if (row) {
        return row.duration
    } else {
        return 0
    }
}

function setSeen(url, seenStatus) {
    if (seenStatus == 0 || seenStatus == 1) {
        const res = db.prepare(/*sql */`update video set seen = ? where url = ?`).run(seenStatus, url)
        if (res && res.changes === 1) {
            console.log("Changed " + url + " to SeenStatus " + seenStatus)
            return "success"
        } else {
            const insert = db.prepare(/*sql */`insert into video(seen, url) values (?, ?)`).run(seenStatus, url)

            if (insert && insert.changes === 1) {
                console.log("Added " + url + " with seenStatus " + seenStatus)
                return "success"
            } else {
                console.log("could not insert " + url + " into database")
                return "could not insert " + url + " into database"
            }
        }
    } else {
        console.log("unknown seen value " + seenStatus)
        return "unknown seen value"
    }
}

db.exec(/*sql */`
        CREATE TABLE IF NOT EXISTS video (
            id INTEGER primary key AUTOINCREMENT,
            url TEXT not null unique,
            seen integer not null,
            duration integer
        )
`
);

// const rows = db.prepare(/*sql*/`SELECT id, url, seen FROM video`).all();
// for (var i = 0; i < rows.length; i++) {
//     console.log(rows[i]);
// }


module.exports = {
    getSeen,
    setSeen,
    isInDatabaseAndHasDuration,
    setDurationOrInsert,
    getNumberOfRows,
    getDuration
}
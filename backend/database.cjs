var Database = require('better-sqlite3');
var db = new Database('videos.db');

function getSeen(url) {
    const row = db.prepare(/*sql */`select * from video where url=?`).get(url)
    if (row) {
        return row.seen
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
                console.log("could not insert "+ url + " into database")
                return "could not insert "+ url + " into database"
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
            seen integer not null
        )
`
);

// const rows = db.prepare(/*sql*/`SELECT id, url, seen FROM video`).all();
// for (var i = 0; i < rows.length; i++) {
//     console.log(rows[i]);
// }


module.exports = {
    getSeen,
    setSeen
}
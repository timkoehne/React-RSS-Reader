import RssTableRow from "./RssTableRow"
function RssTable({ rowsData }) {

    return (
        <div className="container">
            <table className="table">
                <thead>
                    <tr>
                        <th className="authorColumn">Author</th>
                        <th className="titleColumn">Title</th>
                        <th className="dateColumn">Date</th>
                    </tr>
                </thead>
                <tbody>
                    <RssTableRow rowsData={rowsData} />
                </tbody>
            </table>
        </div>
    )
}
export default RssTable
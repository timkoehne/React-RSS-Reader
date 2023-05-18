import RssTableRow from "./RssTableRow"
function RssTable({ rowsData, setRowsData }) {

    const deleteTableRows = (index) => {
        const rows = [...rowsData];
        rows.splice(index, 1);
        setRowsData(rows);
    }

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
                    <RssTableRow rowsData={rowsData} deleteTableRows={deleteTableRows} />
                </tbody>
            </table>
        </div>
    )
}
export default RssTable
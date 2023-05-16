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
                        <th>Author</th>
                        <th>Title</th>
                        <th>Date</th>
                        <th><button className="btn btn-outline-success">+</button></th>
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
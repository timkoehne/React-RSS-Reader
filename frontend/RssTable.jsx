import { VariableSizeGrid } from 'react-window';

const columns = [
    { title: "", width: 30, linkTo: "" },
    { title: "author", width: 200, linkTo: "authorUrl" },
    { title: "title", width: 750, linkTo: "url" },
    { title: "date", width: 200, linkTo: "" }]

const dateFormat = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
}

export default function RssTable({ rowsData, onSeenClick }) {

    const Cell = ({ columnIndex, rowIndex, style }) => (

        columns[columnIndex].linkTo !== "" ? //if 
            <div className="tableCell" style={style}>
                <a href={rowsData[rowIndex][columns[columnIndex].linkTo]}>
                    {rowsData[rowIndex][columns[columnIndex].title]}
                </a>
            </div>
            : //else
            columns[columnIndex].title === "date" ? //else if "date"
                <div className="tableCell" style={style}>
                    {new Date(rowsData[rowIndex][columns[columnIndex].title]).toLocaleString("de-DE", dateFormat)}
                </div> : //else if "seen"
                <div style={style} >
                    <input type="checkbox" defaultChecked={rowsData[rowIndex].seen} onChange={(e) => {
                        onSeenClick([rowIndex], e.target.checked)
                    }}></input>
                </div>
    );

    function generateHeader() {
        return (<div className="tableHeader">
            {columns.map((column, index) => (
                <div className={column.title} key={index} style={{ textAlign: 'left', width: column.width }}>{column.title}</div>
            ))}
        </div>)
    }

    return (
        <div>
            {generateHeader()}

            <VariableSizeGrid
                columnCount={columns.length}
                columnWidth={index => columns[index].width}
                height={810}
                rowCount={rowsData.length}
                rowHeight={() => 35}
                width={columns.reduce((acc, curr) => acc + curr.width, 0)}>
                {Cell}
            </VariableSizeGrid>
        </div >
    )
}
import { VariableSizeGrid } from 'react-window';
import * as React from 'react';
import { columns } from './columns';

const dateFormat = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
}

function formatDuration(seconds) {
    const hours = Math.floor(seconds / (60 * 60))
    seconds = seconds % (60 * 60)
    const minutes = Math.floor(seconds / 60)
    seconds = seconds % 60

    var output = String(minutes).padStart(2, '0') + ":" + String(seconds).padStart(2, '0')
    if (hours > 0) {
        output = String(hours).padStart(2, '0') + ":" + output
    }
    return output
}

export default function RssTable({ filteredRowsData, onSeenClick }) {

    const Cell = ({ columnIndex, rowIndex, style }) => (

        columns[columnIndex].linkTo !== "" ? //if author or title
            <div className="tableCell" style={style}>
                <a href={filteredRowsData[rowIndex][columns[columnIndex].linkTo]}>
                    {filteredRowsData[rowIndex][columns[columnIndex].title]}
                </a>
            </div>
            : //else
            columns[columnIndex].title === "date" ? //else if "date"
                <div className="tableCell" style={style}>
                    {new Date(filteredRowsData[rowIndex][columns[columnIndex].title]).toLocaleString("de-DE", dateFormat)}
                </div> :
                columns[columnIndex].title === "" ? //else if "seen"
                    <div style={style} >
                        <input type="checkbox" defaultChecked={filteredRowsData[rowIndex].seen} onChange={(e) => {
                            onSeenClick([filteredRowsData[rowIndex]["url"]], e.target.checked)
                        }}></input>
                    </div> : //else  "duration"
                    <div className="tableCell" style={style} >
                        {formatDuration(filteredRowsData[rowIndex][columns[columnIndex].title])}
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
                rowCount={filteredRowsData.length}
                rowHeight={() => 35}
                width={columns.reduce((acc, curr) => acc + curr.width, 0)}>
                {Cell}
            </VariableSizeGrid>
        </div >
    )
}
import { VariableSizeGrid } from 'react-window';

const columns = [{ title: "author", width: 200, linkTo: "authorUrl" }, { title: "title", width: 650, linkTo: "url" }, { title: "date", width: 150, linkTo: "" }]

const dateFormat = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
}

export default function RssTable({ rowsData }) {

    const Cell = ({ columnIndex, rowIndex, style }) => (

        columns[columnIndex].linkTo !== "" ? //if
            <div className="tableCell" style={style}>
                <a href={rowsData[rowIndex][columns[columnIndex].linkTo]}>
                    {rowsData[rowIndex][columns[columnIndex].title]}
                </a>
            </div>
            : //else
            <div className="tableCell" style={style}>
                {new Date(rowsData[rowIndex][columns[columnIndex].title]).toLocaleString("de-DE", dateFormat)}
            </div>
    );


    function generateHeader() {
        return (<div className="tableHeader">
            {columns.map((column, index) => (
                <div key={index} style={{width: column.width, textAlign: 'left'}}>{column.title}</div>
            ))}
        </div>)
    }



    return (
        <>
            {generateHeader()}

            <VariableSizeGrid
                columnCount={columns.length}
                columnWidth={index => columns[index]["width"]}
                height={800}
                rowCount={rowsData.length}
                rowHeight={() => 50}
                width={columns.reduce((accumulator, curr) => accumulator + curr["width"], 0)} >
                {Cell}
            </VariableSizeGrid>
        </>
    )
}
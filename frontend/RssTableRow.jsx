import dateFormattingConfig from "../dateFormattingConfig.cjs";

export default function RssTableRow({ rowsData }) {

    return (
        rowsData.map((data, index) => {
            const { author, authorUrl, title, date, url } = data;

            return (
                <tr key={index}>
                    <td className="authorColumn"><a name="author" className="form-control" href={authorUrl}> {author} </a></td>
                    <td className=" titleColumn"><a name="title" className="form-control" href={url}> {title}</a></td>
                    <td className="dateColumn">
                        <div name="date" className="form-control">
                            {new Date(date).toLocaleString(dateFormattingConfig.locale, dateFormattingConfig.dateFormatParam)}
                        </div>
                    </td>
                </tr>
            )
        })

    )

}

export default function RssTableRow({ rowsData }) {

    return (
        rowsData.map((data, index) => {
            const { author, authorUrl, title, date, url } = data;

            const dateFormatParam = {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
            }

            return (
                <tr key={index}>
                    <td className="authorColumn"><a name="author" className="form-control" href={authorUrl}> {author} </a></td>
                    <td className=" titleColumn"><a name="title" className="form-control" href={url}> {title}</a></td>
                    <td className="dateColumn"><div name="date" className="form-control" > {new Date(date).toLocaleString("de-DE", dateFormatParam)}</div></td>
                </tr>
            )
        })

    )

}

export const columns = [
    { title: "", width: 30, linkTo: "", comparators: [] },
    { title: "author", width: 200, linkTo: "authorUrl", comparators: ["Contains", "ContainsIgnoreCase", "Equals", "EqualsIgnoreCase"] },
    { title: "duration", width: 70, linkTo: "", comparators: ["==", ">", "<", ">=", "<="] },
    { title: "title", width: 750, linkTo: "url", comparators: ["Contains", "ContainsIgnoreCase", "Equals", "EqualsIgnoreCase"] },
    { title: "date", width: 200, linkTo: "", comparators: [] }
]

export function findColumn(title){
    for(var column in columns){
        if(title == columns[column]["title"]){
            return columns[column]
        }
    }
}
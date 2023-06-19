export var matchFunction = {
  ">=": function (column, match) { return column >= match },
  ">": function (column, match) { return column > match },
  "<=": function (column, match) { return column <= match },
  "<": function (column, match) { return column < match },
  "==": function (column, match) { return column == match },
  "Contains": function (column, match) { return column.includes(match) },
  "ContainsIgnoreCase": function (column, match) { return column.toLowerCase().includes(match.toLowerCase()) },
  "Equals": function (column, match) { return column == match },
  "EqualsIgnoreCase": function (column, match) { return column.toLowerCase() == match.toLowerCase() }
}


export function checkFilters(row, filters) {
  for (var i = 0; i < filters.length; i++) {
    const matchComparator = filters[i]["matchComparator"]
    const column = filters[i]["column"]
    const toMatch = filters[i]["match"]
    const blacklist = filters[i]["blacklist"]

    if (blacklist) {
      if (matchFunction[matchComparator](row[column], toMatch)) return false
    }
    else {
      if (!matchFunction[matchComparator](row[column], toMatch)) return false
    }
  }
  return true
}
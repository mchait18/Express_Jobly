const { BadRequestError } = require("../expressError");

// THIS function takes a json object with columns to update and 
//converts them to a string with the sql column names corresponding to a variable like this $1, $2, etc.
function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  //extract the column names that need updating
  const keys = Object.keys(dataToUpdate);
  //if empty, no data to update
  if (keys.length === 0) throw new BadRequestError("No data");

  //changes the column names from the json names to the sql names if they appear in the jsToSql object
  //{firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );
//return an obj with a sql string of columns to update with the sql names and corresponding $nums, and and array with their values
  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };

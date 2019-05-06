#!/usr/bin/env node

/*

Uses the Google Sheets API to pull data from Sheets and load it onto shared
state. Writes the data out to JSON for later reference. Does not currently
check for existing data to merge--it does a fresh pull every time.

Sheets must be both A) shared publicly and B) "published to web" before they
can be accessed by this task.

*/

var async = require("async");
var sheets = require("google-spreadsheets");

// Get data from config
let projectConfig = require("../project-config.json");
projectConfig = projectConfig.GOOGLE_SHEETS;

// Some special formatting functions
var camelCase = function(str) {
  return str.replace(/[^\w]+(\w)/g, function(all, match) {
    return match.toUpperCase();
  });
};

var cast = function(str) {
  if (typeof str !== "string") {
    if (typeof str.value == "string") {
      str = str.value;
    } else {
      return str;
    }
  }
  if (str.match(/^[\d\.,]+$/)) {
    //number
    return Number(str.replace(/,/g, ""));
  }
  if (str.toLowerCase() == "true" || str.toLowerCase() == "false") {
    return str.toLowerCase() == "true" ? true : false;
  }
  return str;
};

// Error out if there aren't keys
var sheetKeys = projectConfig;
if (!sheetKeys || !sheetKeys.length) {
  throw new Error("You must specify at least one spreadsheet key in public-config.json!");
}

// Go get the data and make some json files
async.each(sheetKeys, function(key, bookDone) {
  sheets({
    key: key
  }, function(err, book) {
    if (err || !book) {
      console.warn("ERROR: Unable to access book for " + key + ", is it 'published' in Sheets?");
      return bookDone();
    }
    //download each worksheet
    async.each(book.worksheets, function(page, pageDone) {
      sheets.cells({ key: key, worksheet: page.id }, function(err, cells) {
        if (err) {
          console.warn("ERROR: Couldn't load sheet " + page.id + " for " + book.title);
          return pageDone();
        }
        cells = cells.cells;

        //get the header row
        var rowNumbers = Object.keys(cells);
        var headerNumber = rowNumbers.shift();
        var headers = cells[headerNumber];
        var isKeyed = false;
        for (var cell in headers) {
          headers[cell] = headers[cell].value;
          if (headers[cell] == "key") {
            isKeyed = true;
          }
        }

        var output = isKeyed ? {} : [];

        //create the rows
        rowNumbers.forEach(function(rowNum) {
          var line = cells[rowNum];
          var columnNumbers = Object.keys(line);
          var row = {};
          columnNumbers.forEach(function(colNum) {
            var value = line[colNum];
            var key = headers[colNum];
            row[key] = cast(value);
          });
          if (isKeyed) {
            output[row.key] = row;
            delete row.key;
          } else {
            output.push(row);
          }
        });

        var filename = "src/data/" + camelCase(page.title) + ".sheet.json";
        var writeFile = require('write');
        writeFile(filename, JSON.stringify(output, null, 2), function(err) {
          if (err){
            console.log(err);
          } else {
            console.log("Created data sheet at " + filename);
          }
        });
        pageDone();
      });
    }, bookDone);
  });
});
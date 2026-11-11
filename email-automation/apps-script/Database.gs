/**
 * Database.gs
 * ----------------------------------------------------------------------------
 * Thin data-access layer over Google Sheets. Tables are read by HEADER NAME,
 * so the owner can re-order or add columns without breaking anything.
 */

var Db = {
  _ss: null,

  ss: function () {
    if (this._ss) return this._ss;
    var ss = null;
    try { ss = SpreadsheetApp.getActiveSpreadsheet(); } catch (e) { ss = null; }
    if (!ss) {
      var id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
      if (!id) throw new Error('Spreadsheet not found. Open the Google Sheet and run "Setup / Repair System" once.');
      ss = SpreadsheetApp.openById(id);
    }
    this._ss = ss;
    return ss;
  },

  sheet: function (name) {
    var sh = this.ss().getSheetByName(name);
    if (!sh) throw new Error('Sheet "' + name + '" is missing. Run menu: Email Automation → Setup / Repair System.');
    return sh;
  },

  /**
   * Reads a whole table. Returns
   *   { sheet, headers, col: {header: 1-based column}, rows: [ {_row, header: value, ...} ] }
   */
  read: function (name) {
    var sh = this.sheet(name);
    var lastRow = sh.getLastRow();
    var lastCol = sh.getLastColumn();
    if (lastCol < 1) return { sheet: sh, headers: [], col: {}, rows: [] };
    var values = sh.getRange(1, 1, Math.max(lastRow, 1), lastCol).getValues();
    var headers = values[0].map(function (h) { return String(h).trim(); });
    var col = {};
    headers.forEach(function (h, i) { if (h && !col[h]) col[h] = i + 1; });
    var rows = [];
    for (var r = 1; r < values.length; r++) {
      var row = values[r];
      var empty = true;
      for (var c = 0; c < row.length; c++) { if (row[c] !== '' && row[c] !== null && row[c] !== false) { empty = false; break; } }
      if (empty) continue;
      var obj = { _row: r + 1 };
      headers.forEach(function (h, i) { if (h) obj[h] = row[i]; });
      rows.push(obj);
    }
    return { sheet: sh, headers: headers, col: col, rows: rows };
  },

  /**
   * Writes selected fields of one row object back to the sheet.
   * Before writing, the row's key (first column, e.g. Contact ID / Queue Key)
   * is re-checked so a row deleted or moved by hand meanwhile can never cause
   * a write into the wrong record.
   */
  update: function (table, rowObj, fields) {
    if (!this.verifyRow_(table, rowObj)) {
      try { console.log('Row for ' + rowObj[table.headers[0]] + ' no longer found in ' + table.sheet.getName() + ' — write skipped.'); } catch (e) {}
      return false;
    }
    Object.keys(fields).forEach(function (h) {
      var c = table.col[h];
      if (!c) throw new Error('Column "' + h + '" not found in sheet ' + table.sheet.getName());
      table.sheet.getRange(rowObj._row, c).setValue(fields[h]);
      rowObj[h] = fields[h];
    });
    return true;
  },

  /** Confirms rowObj._row still holds the same key; relocates it if rows moved. */
  verifyRow_: function (table, rowObj) {
    var keyHeader = table.headers[0];
    var key = rowObj[keyHeader];
    if (key === '' || key === null || key === undefined) return true; // nothing to verify against
    var current = table.sheet.getRange(rowObj._row, 1).getValue();
    if (String(current) === String(key)) return true;
    var last = table.sheet.getLastRow();
    if (last < 2) return false;
    var col = table.sheet.getRange(2, 1, last - 1, 1).getValues();
    for (var i = 0; i < col.length; i++) {
      if (String(col[i][0]) === String(key)) { rowObj._row = i + 2; return true; }
    }
    return false;
  },

  /**
   * Writes a contiguous block of fields for one row in a single API call when
   * the fields are adjacent; otherwise falls back to per-cell writes.
   */
  updateFast: function (table, rowObj, fields) {
    var cols = Object.keys(fields).map(function (h) {
      if (!table.col[h]) throw new Error('Column "' + h + '" not found in sheet ' + table.sheet.getName());
      return table.col[h];
    }).sort(function (a, b) { return a - b; });
    var contiguous = cols.length > 0 && cols[cols.length - 1] - cols[0] === cols.length - 1;
    if (!contiguous) return this.update(table, rowObj, fields);
    if (!this.verifyRow_(table, rowObj)) return false;
    var rowVals = [];
    for (var c = cols[0]; c <= cols[cols.length - 1]; c++) {
      var h = table.headers[c - 1];
      rowVals.push(fields[h]);
      rowObj[h] = fields[h];
    }
    table.sheet.getRange(rowObj._row, cols[0], 1, rowVals.length).setValues([rowVals]);
  },

  /** Appends objects (keyed by header) as new rows in one batch. */
  appendObjects: function (name, objects) {
    if (!objects || !objects.length) return;
    var sh = this.sheet(name);
    var lastCol = sh.getLastColumn();
    var headers = sh.getRange(1, 1, 1, lastCol).getValues()[0].map(function (h) { return String(h).trim(); });
    var data = objects.map(function (o) {
      return headers.map(function (h) { return o[h] === undefined || o[h] === null ? '' : o[h]; });
    });
    var start = this.lastDataRow_(sh) + 1;
    sh.getRange(start, 1, data.length, headers.length).setValues(data);
  },

  /** Last row that actually contains data (ignores formatted empty rows / unticked checkboxes). */
  lastDataRow_: function (sh) {
    var last = sh.getLastRow();
    if (last < 2) return Math.max(last, 1);
    var vals = sh.getRange(1, 1, last, Math.max(sh.getLastColumn(), 1)).getValues();
    for (var r = vals.length - 1; r >= 1; r--) {
      for (var c = 0; c < vals[r].length; c++) {
        var v = vals[r][c];
        if (v !== '' && v !== null && v !== false) return r + 1;
      }
    }
    return 1;
  },

  /** Generates the next sequential ID like C0001 / CMP-001 for a column. */
  nextId: function (table, header, prefix, width) {
    var max = 0;
    var re = new RegExp('^' + prefix.replace(/[-]/g, '\\-') + '(\\d+)$');
    table.rows.forEach(function (r) {
      var m = String(r[header] || '').match(re);
      if (m) max = Math.max(max, parseInt(m[1], 10));
    });
    var n = String(max + 1);
    while (n.length < width) n = '0' + n;
    return prefix + n;
  }
};

// This worker's response CSP allows only versioned runtime assets, never /api or /auth.
let runtime;
async function initialize() {
  const { version } = await (await fetch('/analytics-runtime/version.json', { cache: 'no-cache' })).json();
  const indexURL = new URL(`/analytics-runtime/${version}/`, self.location.origin).href;
  const { loadPyodide } = await import(indexURL + 'pyodide.mjs');
  const py = await loadPyodide({ indexURL, stdout: () => {}, stderr: () => {} });
  await py.loadPackage('pandas');
  return py;
}
self.onmessage = async ({ data }) => {
  try {
    self.postMessage({ status: 'loading' });
    const py = await (runtime ??= initialize());
    py.globals.set('_payload_json', JSON.stringify(data));
    const output = await py.runPythonAsync(`
import json, sqlite3, pandas as pd
_payload = json.loads(_payload_json)
tables = {name: pd.DataFrame(rows, columns=_payload['columns'][name]) for name, rows in _payload['tables'].items()}
start_date, end_date, timezone = (_payload[k] for k in ('start_date', 'end_date', 'timezone'))
daily, model_daily, goals, goals_daily, purposes = (tables[k] for k in ('daily', 'model_daily', 'goals', 'goals_daily', 'purposes'))
if _payload['language'] == 'sql':
    _db = sqlite3.connect(':memory:')
    for _name, _df in tables.items():
        if len(_df.columns):
            _df.to_sql(_name, _db, index=False)
    _allowed = {sqlite3.SQLITE_SELECT, sqlite3.SQLITE_READ, sqlite3.SQLITE_FUNCTION, sqlite3.SQLITE_RECURSIVE}
    _db.set_authorizer(lambda action, *args: sqlite3.SQLITE_OK if action in _allowed else sqlite3.SQLITE_DENY)
    _cur = _db.execute(_payload['code'], {'start_date': start_date, 'end_date': end_date, 'timezone': timezone})
    _rows = _cur.fetchmany(10001)
    if len(_rows) > 10000:
        raise ValueError('Result exceeds 10,000 rows. Aggregate or add LIMIT.')
    result = pd.DataFrame(_rows, columns=[c[0] for c in _cur.description])
    _db.close()
else:
    result = None
    exec(compile(_payload['code'], '<analytics>', 'exec'))
if not isinstance(result, pd.DataFrame):
    raise ValueError('Assign a pandas DataFrame to result.')
if len(result) > 10000 or len(result.columns) > 100:
    raise ValueError('Result limit: 10,000 rows and 100 columns.')
_output = json.dumps({'columns': [str(c) for c in result.columns], 'rows': json.loads(result.to_json(orient='records', date_format='iso'))})
if len(_output) > 5000000:
    raise ValueError('Result exceeds 5 MB. Aggregate your data.')
_output
`);
    self.postMessage({ result: JSON.parse(output) });
  } catch (error) {
    self.postMessage({ error: String(error.message || error).slice(-2500) });
  }
};

const triggerDownload = (content, filename, mime) => {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
const escapeCsvCell = (value) => {
  if (value === null || value === void 0) return "";
  const str = String(value);
  const safe = /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;
  if (/[",\n\r]/.test(safe)) return `"${safe.replace(/"/g, '""')}"`;
  return safe;
};
const exportToCsv = (filename, columns, rows) => {
  const head = columns.map((c) => escapeCsvCell(c.header)).join(",");
  const body = rows.map((r) => columns.map((c) => escapeCsvCell(c.value(r))).join(",")).join("\n");
  triggerDownload(`${head}
${body}`, filename, "text/csv;charset=utf-8;");
};
const exportToJson = (filename, data) => {
  triggerDownload(JSON.stringify(data, null, 2), filename, "application/json");
};
export {
  exportToCsv,
  exportToJson
};

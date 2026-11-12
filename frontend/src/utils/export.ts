// Shared client-side export helpers (CSV + JSON) used by Members, Payments and Admin.

const triggerDownload = (content: string, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

const escapeCsvCell = (value: unknown): string => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    // Guard against CSV injection: prefix cells that could be parsed as a formula.
    const safe = /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;
    if (/[",\n\r]/.test(safe)) return `"${safe.replace(/"/g, '""')}"`;
    return safe;
};

export interface CsvColumn<T> {
    header: string;
    value: (row: T) => unknown;
}

export const exportToCsv = <T,>(filename: string, columns: CsvColumn<T>[], rows: T[]): void => {
    const head = columns.map(c => escapeCsvCell(c.header)).join(',');
    const body = rows.map(r => columns.map(c => escapeCsvCell(c.value(r))).join(',')).join('\n');
    triggerDownload(`${head}\n${body}`, filename, 'text/csv;charset=utf-8;');
};

export const exportToJson = (filename: string, data: unknown): void => {
    triggerDownload(JSON.stringify(data, null, 2), filename, 'application/json');
};

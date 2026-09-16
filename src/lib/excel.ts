import ExcelJS from 'exceljs';
import * as XLSX from 'xlsx';

export async function exportToExcel(
  filename: string,
  sheets: { name: string; columns: { header: string; key: string; width?: number }[]; data: Record<string, any>[] }[]
) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Walton Process Development & IE System';
  workbook.created = new Date();

  for (const sheetInfo of sheets) {
    const sheet = workbook.addWorksheet(sheetInfo.name);

    sheet.columns = sheetInfo.columns.map((col) => ({
      header: col.header,
      key: col.key,
      width: col.width || 20,
    }));

    // Header styling
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF005697' }, // Walton Blue
    };

    sheet.addRows(sheetInfo.data);

    // Auto-fit rows and add light border
    sheet.eachRow((row, rowNumber) => {
      row.alignment = { vertical: 'middle' };
      if (rowNumber > 1) {
        row.border = {
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };
      }
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.xlsx`;
  a.click();
  window.URL.revokeObjectURL(url);
}

export function exportToCSV(filename: string, data: Record<string, any>[]) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map((row) =>
      headers
        .map((header) => {
          const val = row[header] ?? '';
          const escaped = String(val).replace(/"/g, '""');
          return `"${escaped}"`;
        })
        .join(',')
    ),
  ];

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
}

export interface ParsedSheetData {
  sheetNames: string[];
  sheets: Record<string, { headers: string[]; rows: Record<string, any>[] }>;
}

export async function parseExcelUpload(file: File): Promise<ParsedSheetData> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });

  const result: ParsedSheetData = {
    sheetNames: workbook.SheetNames,
    sheets: {},
  };

  for (const name of workbook.SheetNames) {
    const worksheet = workbook.Sheets[name];
    const rawJson = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { header: 1 });

    if (rawJson && rawJson.length > 0) {
      const headers = (rawJson[0] as string[]).map((h) => String(h || '').trim()).filter(Boolean);
      const rows: Record<string, any>[] = [];

      for (let i = 1; i < rawJson.length; i++) {
        const rowData = rawJson[i] as any[];
        if (!rowData || !rowData.some((cell) => cell !== undefined && cell !== '')) continue;

        const rowObj: Record<string, any> = {};
        headers.forEach((header, idx) => {
          rowObj[header] = rowData[idx] !== undefined ? rowData[idx] : '';
        });
        rows.push(rowObj);
      }

      result.sheets[name] = { headers, rows };
    } else {
      result.sheets[name] = { headers: [], rows: [] };
    }
  }

  return result;
}

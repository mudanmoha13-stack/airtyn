"use client";

/**
 * CsvSheetImporter
 * ──────────────────
 * Drop / pick a CSV, XLS or XLSX file → auto-detect columns →
 * let the user map each target field to a sheet column →
 * preview first 5 rows → import to the appropriate API endpoint.
 *
 * Modes:
 *   'inventory' → POST /api/business/inventory/import
 *   'products'  → POST /api/business/products/import
 */

import React, { useCallback, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, ChevronDown, FileSpreadsheet, Upload, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// ─── Target schemas ───────────────────────────────────────────────────────────

type FieldSpec = {
  key: string;
  label: string;
  required?: boolean;
  hint?: string;
};

const INVENTORY_FIELDS: FieldSpec[] = [
  { key: 'name',          label: 'Product Name',        required: false, hint: 'Leave blank to use Inventory ID as name' },
  { key: 'sku',           label: 'Inventory ID / SKU',  required: false,  hint: 'e.g. IN0001' },
  { key: 'description',   label: 'Description',         required: false },
  { key: 'unitPrice',     label: 'Selling Price / Unit Price', required: false, hint: 'e.g. $51.00 or 51' },
  { key: 'costPrice',     label: 'Cost Price / Unit Cost',     required: false, hint: 'Purchase or landed cost per item' },
  { key: 'quantity',      label: 'Quantity in Stock',   required: false },
  { key: 'reorderLevel',  label: 'Reorder Level',       required: false },
  { key: 'reorderTime',   label: 'Reorder Time (days)', required: false },
  { key: 'reorderQty',    label: 'Reorder Quantity',    required: false },
  { key: 'discontinued',  label: 'Discontinued?',       required: false },
  { key: 'warehouse',     label: 'Warehouse',           required: false, hint: 'Default: Main Warehouse' },
];

const PRODUCT_FIELDS: FieldSpec[] = [
  { key: 'name',        label: 'Product Name',   required: true                    },
  { key: 'sku',         label: 'SKU / Code',     required: false                   },
  { key: 'description', label: 'Description',    required: false                   },
  { key: 'category',    label: 'Category',       required: false                   },
  { key: 'basePrice',   label: 'Selling Price',  required: false, hint: 'e.g. 49.99' },
  { key: 'costPrice',   label: 'Cost Price',     required: false                   },
  { key: 'productType', label: 'Product Type',   required: false, hint: 'physical / digital / service / bundle' },
];

const SKIP_VALUE = '__skip__';
const FIELD_MAP: Record<string, FieldSpec[]> = {
  inventory: INVENTORY_FIELDS,
  products:  PRODUCT_FIELDS,
};
const IMPORT_URL: Record<string, string> = {
  inventory: '/api/business/inventory/import',
  products:  '/api/business/products/import',
};

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  mode: 'inventory' | 'products';
  onImported?: (count: number) => void;
};

// ─── Component ────────────────────────────────────────────────────────────────

export const CsvSheetImporter: React.FC<Props> = ({ mode, onImported }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<'idle' | 'mapping' | 'importing' | 'done' | 'error'>('idle');
  const [fileName, setFileName] = useState('');
  const [sheetHeaders, setSheetHeaders] = useState<string[]>([]);
  const [previewRows, setPreviewRows] = useState<string[][]>([]);
  const [allRows, setAllRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({}); // fieldKey → column header
  const [importCount, setImportCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const fields = FIELD_MAP[mode];

  // ── Parse file ──────────────────────────────────────────────────────────────

  const parseFile = useCallback(async (file: File) => {
    try {
      const XLSX = await import('xlsx');
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const raw = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as string[][];

      // Skip empty leading rows, find the header row (first row with >2 non-empty cells)
      let headerRowIdx = 0;
      for (let i = 0; i < raw.length; i++) {
        const nonEmpty = raw[i].filter((c) => String(c ?? '').trim().length > 0).length;
        if (nonEmpty >= 2) {
          headerRowIdx = i;
          break;
        }
      }

      const headers = raw[headerRowIdx].map((h) => String(h ?? '').trim()).filter(Boolean);
      const dataRows = raw
        .slice(headerRowIdx + 1)
        .filter((row) => row.some((cell) => String(cell ?? '').trim().length > 0));

      setSheetHeaders(headers);
      setPreviewRows(dataRows.slice(0, 5).map((r) => headers.map((_, i) => String(r[i] ?? ''))));
      setAllRows(dataRows.map((r) => headers.map((_, i) => String(r[i] ?? ''))));

      // Auto-map: find best match between target field labels/keys and actual column headers
      const autoMapping: Record<string, string> = {};
      const normalise = (s: string) =>
        s.toLowerCase().replace(/[^a-z0-9]/g, '');

      for (const field of fields) {
        const candidates = [
          field.key,
          field.label,
          ...(field.hint ? [field.hint] : []),
        ];
        for (const header of headers) {
          const normH = normalise(header);
          if (candidates.some((c) => normalise(c) === normH || normH.includes(normalise(c)) || normalise(c).includes(normH))) {
            autoMapping[field.key] = header;
            break;
          }
        }
      }
      setMapping(autoMapping);
      setStep('mapping');
    } catch {
      setErrorMessage('Could not parse the file. Please use a CSV, XLS, or XLSX file.');
      setStep('error');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fields]);

  // ── File input handlers ────────────────────────────────────────────────────

  const handleFileSelect = useCallback((file: File | undefined) => {
    if (!file) return;
    setFileName(file.name);
    void parseFile(file);
  }, [parseFile]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files[0]);
  }, [handleFileSelect]);

  // ── Mapping helpers ────────────────────────────────────────────────────────

  const setFieldMapping = (fieldKey: string, header: string) => {
    setMapping((prev) => {
      const next = { ...prev };
      if (header === SKIP_VALUE) {
        delete next[fieldKey];
      } else {
        next[fieldKey] = header;
      }
      return next;
    });
  };

  const getMappedColumnIndex = (header: string) =>
    sheetHeaders.indexOf(header);

  // ── Build payload from mapped columns ─────────────────────────────────────

  const buildRows = () => {
    return allRows.map((row) => {
      const mapped: Record<string, string> = {};
      for (const field of fields) {
        const header = mapping[field.key];
        if (!header) continue;
        const idx = getMappedColumnIndex(header);
        mapped[field.key] = idx >= 0 ? (row[idx] ?? '').trim() : '';
      }
      return mapped;
    }).filter((row) => {
      if (mode === 'inventory') {
        // keep rows that have at least a name or a SKU/inventory-id value
        return (row['name'] ?? '').length > 0 || (row['sku'] ?? '').length > 0;
      }
      // products mode – name is required
      return fields
        .filter((f) => f.required)
        .every((f) => (row[f.key] ?? '').length > 0);
    });
  };

  // ── Import ─────────────────────────────────────────────────────────────────

  const doImport = async () => {
    setStep('importing');
    setErrorMessage('');
    const rows = buildRows();
    if (rows.length === 0) {
      setErrorMessage('No valid rows to import after applying column mapping. Check that required fields are mapped correctly.');
      setStep('error');
      return;
    }

    try {
      const response = await fetch(IMPORT_URL[mode], {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows }),
      });

      const data = (await response.json()) as { ok: boolean; imported?: number; error?: string };

      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? 'Import failed');
      }

      setImportCount(data.imported ?? rows.length);
      setStep('done');
      onImported?.(data.imported ?? rows.length);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Import failed');
      setStep('error');
    }
  };

  // ── Reset ──────────────────────────────────────────────────────────────────

  const reset = () => {
    setStep('idle');
    setFileName('');
    setSheetHeaders([]);
    setPreviewRows([]);
    setAllRows([]);
    setMapping({});
    setImportCount(0);
    setErrorMessage('');
    if (inputRef.current) inputRef.current.value = '';
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const modeLabel = mode === 'inventory' ? 'Inventory' : 'Products';

  return (
    <Card className="glass-card border-white/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Import {modeLabel} from File</CardTitle>
          </div>
          {step !== 'idle' && (
            <Button size="sm" variant="ghost" onClick={reset} className="text-muted-foreground">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <CardDescription>
          Upload a CSV, XLS, or XLSX file. Map your columns to {modeLabel.toLowerCase()} fields, then import.
          Different businesses use different column names — you control the mapping.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* ── Step: idle ── */}
        {step === 'idle' && (
          <div
            className={`relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 transition-colors ${isDragging ? 'border-primary bg-primary/10' : 'border-white/10 hover:border-white/20'}`}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
          >
            <Upload className="mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">Drop your file here or click to browse</p>
            <p className="mt-1 text-xs text-muted-foreground">.csv · .xls · .xlsx</p>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.xls,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              className="sr-only"
              onChange={(e) => handleFileSelect(e.target.files?.[0])}
            />
          </div>
        )}

        {/* ── Step: mapping ── */}
        {step === 'mapping' && (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium text-foreground">{fileName}</p>
              <Badge variant="outline" className="border-white/10 text-muted-foreground">
                {allRows.length} rows · {sheetHeaders.length} columns detected
              </Badge>
            </div>

            {/* Column mapping */}
            <div>
              <p className="mb-3 text-sm font-semibold text-foreground">Map your columns</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {fields.map((field) => (
                  <div key={field.key} className="space-y-1">
                    <Label className="flex items-center gap-1 text-xs text-muted-foreground">
                      {field.label}
                      {field.required && <span className="text-destructive">*</span>}
                      {field.hint && (
                        <span className="text-muted-foreground/60">· {field.hint}</span>
                      )}
                    </Label>
                    <Select
                      value={mapping[field.key] ?? SKIP_VALUE}
                      onValueChange={(v) => setFieldMapping(field.key, v)}
                    >
                      <SelectTrigger className="border-white/10 bg-card/40 h-8 text-xs">
                        <SelectValue placeholder="— skip —" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={SKIP_VALUE}>— skip —</SelectItem>
                        {sheetHeaders.map((h) => (
                          <SelectItem key={h} value={h}>{h}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview table */}
            {previewRows.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <ChevronDown className="h-3 w-3" /> Preview (first {previewRows.length} rows)
                </p>
                <div className="overflow-x-auto rounded-xl border border-white/5">
                  <table className="min-w-full text-xs">
                    <thead className="bg-card/50 text-left text-muted-foreground">
                      <tr>
                        {sheetHeaders.map((h) => (
                          <th key={h} className="px-3 py-2 font-medium whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.map((row, i) => (
                        <tr key={i} className="border-t border-white/5">
                          {row.map((cell, j) => (
                            <td key={j} className="px-3 py-2 text-foreground whitespace-nowrap max-w-[180px] truncate">{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button onClick={doImport} className="gradient-amber text-black font-semibold">
                Import {allRows.length} rows
              </Button>
              <Button variant="outline" className="border-white/10 bg-card/40" onClick={reset}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* ── Step: importing ── */}
        {step === 'importing' && (
          <div className="flex flex-col items-center gap-3 py-8 text-muted-foreground">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-b-transparent" />
            <p className="text-sm">Importing records…</p>
          </div>
        )}

        {/* ── Step: done ── */}
        {step === 'done' && (
          <div className="flex flex-col items-center gap-4 py-8">
            <CheckCircle2 className="h-10 w-10 text-emerald-400" />
            <p className="text-sm font-medium text-foreground">{importCount} records imported successfully.</p>
            <Button variant="outline" className="border-white/10 bg-card/40" onClick={reset}>
              Import another file
            </Button>
          </div>
        )}

        {/* ── Step: error ── */}
        {step === 'error' && (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="text-sm text-muted-foreground">{errorMessage}</p>
            <Button variant="outline" className="border-white/10 bg-card/40" onClick={reset}>
              Try again
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

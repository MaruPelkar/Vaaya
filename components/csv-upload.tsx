'use client';

import { useState, useRef, ChangeEvent, DragEvent } from 'react';
import { CSVRow, CSVProcessingResult } from '@/lib/types';

export default function CSVUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<CSVProcessingResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'text/csv') {
      setFile(droppedFile);
      setError(null);
    } else {
      setError('Please upload a valid CSV file');
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setError(null);
    } else {
      setError('Please upload a valid CSV file');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setResults([]);
    setProgress({ current: 0, total: 0 });

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/csv-upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response stream');
      }

      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;

          try {
            const event = JSON.parse(line);

            if (event.type === 'progress') {
              setProgress({ current: event.current, total: event.total });
            } else if (event.type === 'result') {
              setResults(prev => [...prev, event.data]);
            } else if (event.type === 'complete') {
              setIsProcessing(false);
            } else if (event.type === 'error') {
              setError(event.message);
              setIsProcessing(false);
            }
          } catch (e) {
            console.error('Failed to parse event:', e);
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResults([]);
    setError(null);
    setProgress({ current: 0, total: 0 });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-8">
      {/* Header */}
      <div className="mb-12">
        <h1 className="headline-display text-[48px] mb-4">
          Bolna AI Call Automation
        </h1>
        <p className="text-body text-[var(--vaaya-text-muted)]">
          Upload a CSV file with contact information to initiate automated AI calls
        </p>
      </div>

      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-12 mb-8 text-center transition-all
          ${isDragging
            ? 'border-[var(--vaaya-brand)] bg-[var(--vaaya-neutral)]'
            : 'border-[var(--vaaya-border)] bg-white'
          }
          ${isProcessing ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}
        `}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="hidden"
          disabled={isProcessing}
        />

        <div className="text-4xl mb-4">📊</div>

        {file ? (
          <div>
            <p className="text-body font-semibold mb-2">{file.name}</p>
            <p className="text-sm text-[var(--vaaya-text-muted)]">
              {(file.size / 1024).toFixed(2)} KB
            </p>
          </div>
        ) : (
          <div>
            <p className="text-body font-semibold mb-2">
              Drop your CSV file here or click to browse
            </p>
            <p className="text-sm text-[var(--vaaya-text-muted)]">
              Required columns: sno, name, software, phone_number
            </p>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4 mb-8">
        <button
          onClick={handleUpload}
          disabled={!file || isProcessing}
          className={`
            px-6 py-3 rounded-lg text-white font-medium transition-all
            ${!file || isProcessing
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-[var(--vaaya-brand)] hover:opacity-90'
            }
          `}
        >
          {isProcessing ? 'Processing...' : 'Start AI Calls'}
        </button>

        {(file || results.length > 0) && !isProcessing && (
          <button
            onClick={handleReset}
            className="px-6 py-3 rounded-lg border-2 border-[var(--vaaya-border)] font-medium hover:bg-[var(--vaaya-neutral)] transition-all"
          >
            Reset
          </button>
        )}
      </div>

      {/* Progress */}
      {isProcessing && progress.total > 0 && (
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">Processing calls...</span>
            <span className="text-sm text-[var(--vaaya-text-muted)]">
              {progress.current} / {progress.total}
            </span>
          </div>
          <div className="w-full bg-[var(--vaaya-neutral)] rounded-full h-2">
            <div
              className="bg-[var(--vaaya-brand)] h-2 rounded-full transition-all duration-300"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="border border-[var(--vaaya-border)] rounded-lg bg-white overflow-hidden">
          <div className="p-4 border-b border-[var(--vaaya-border)] bg-[var(--vaaya-neutral)]">
            <h2 className="text-xl font-bold">Results</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--vaaya-neutral)] border-b border-[var(--vaaya-border)]">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">S.No</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Software</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Phone</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Call ID</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-[var(--vaaya-border)] hover:bg-[var(--vaaya-neutral)]"
                  >
                    <td className="px-4 py-3 text-sm">{result.row.sno}</td>
                    <td className="px-4 py-3 text-sm">{result.row.name}</td>
                    <td className="px-4 py-3 text-sm">{result.row.software}</td>
                    <td className="px-4 py-3 text-sm">{result.row.phone_number}</td>
                    <td className="px-4 py-3 text-sm">
                      {result.success ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ✓ {result.bolna_response.status}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          ✗ Failed
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-xs">
                      {result.success ? result.bolna_response.call_id : result.error || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

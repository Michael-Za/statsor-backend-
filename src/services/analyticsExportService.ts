import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface ExportData {
  title: string;
  data: any[];
  metadata?: {
    generatedAt: string;
    generatedBy: string;
    filters?: any;
    sport?: string;
  };
}

interface ExportOptions {
  format: 'excel' | 'csv' | 'json' | 'pdf';
  filename?: string;
  includeMetadata?: boolean;
  includeCharts?: boolean;
}

class AnalyticsExportService {
  async exportAnalytics(exportData: ExportData, options: ExportOptions): Promise<void> {
    try {
      if (!exportData || !exportData.data) {
        throw new Error('No data provided for export');
      }

      if (!Array.isArray(exportData.data)) {
        throw new Error('Export data must be an array');
      }

      if (exportData.data.length === 0) {
        throw new Error('No data available to export');
      }

      if (!options.format) {
        throw new Error('Export format is required');
      }

      const sanitizedTitle = (exportData.title || 'export').replace(/[^a-z0-9]/gi, '_');
      const filename = options.filename || `${sanitizedTitle}_${new Date().toISOString().split('T')[0]}`;

      switch (options.format) {
        case 'excel':
          await this.exportToExcel(exportData, filename, options);
          break;
        case 'csv':
          await this.exportToCSV(exportData, filename);
          break;
        case 'json':
          await this.exportToJSON(exportData, filename);
          break;
        case 'pdf':
          await this.exportToPDF(exportData, filename, options);
          break;
        default:
          throw new Error(`Unsupported export format: ${options.format}`);
      }
    } catch (error: any) {
      console.error('Export failed:', error);
      const errorMessage = error?.message || 'Unknown error';
      throw new Error(`Export failed: ${errorMessage}`);
    }
  }

  private async exportToExcel(exportData: ExportData, filename: string, options: ExportOptions): Promise<void> {
    try {
      const workbook = XLSX.utils.book_new();
      
      // Main data sheet
      if (exportData.data.length > 0) {
        const worksheet = XLSX.utils.json_to_sheet(exportData.data);
        
        // Style the header row
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
        for (let col = range.s.c; col <= range.e.c; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
          if (!worksheet[cellAddress]) continue;
          
          worksheet[cellAddress].s = {
            font: { bold: true, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "4ADE80" } },
            alignment: { horizontal: "center" }
          };
        }
        
        // Auto-size columns
        const colWidths = [];
        for (let col = range.s.c; col <= range.e.c; col++) {
          let maxWidth = 10;
          for (let row = range.s.r; row <= range.e.r; row++) {
            const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
            const cell = worksheet[cellAddress];
            if (cell && cell.v) {
              const cellLength = cell.v.toString().length;
              maxWidth = Math.max(maxWidth, cellLength);
            }
          }
          colWidths.push({ wch: Math.min(maxWidth + 2, 50) });
        }
        worksheet['!cols'] = colWidths;
        
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Analytics Data');
      }
      
      // Metadata sheet if available
      if (exportData.metadata && options.includeMetadata) {
        const metadataArray = Object.entries(exportData.metadata).map(([key, value]) => ({
          Property: key,
          Value: typeof value === 'object' ? JSON.stringify(value) : value
        }));
        const metadataSheet = XLSX.utils.json_to_sheet(metadataArray);
        XLSX.utils.book_append_sheet(workbook, metadataSheet, 'Metadata');
      }
      
      // Summary sheet
      if (exportData.data.length > 0) {
        const summary = this.generateSummaryData(exportData.data);
        const summarySheet = XLSX.utils.json_to_sheet(summary);
        XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
      }
      
      XLSX.writeFile(workbook, `${filename}.xlsx`);
    } catch (error) {
      throw new Error('Excel export failed');
    }
  }

  private async exportToCSV(exportData: ExportData, filename: string): Promise<void> {
    try {
      if (exportData.data.length === 0) {
        throw new Error('No data to export');
      }

      const headers = Object.keys(exportData.data[0]);
      const csvContent = [
        headers.join(','),
        ...exportData.data.map(row => 
          headers.map(header => {
            const value = row[header];
            // Escape commas and quotes in CSV
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value ?? '';
          }).join(',')
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      this.downloadFile(blob, `${filename}.csv`);
    } catch (error) {
      throw new Error('CSV export failed');
    }
  }

  private async exportToJSON(exportData: ExportData, filename: string): Promise<void> {
    try {
      const jsonData = {
        title: exportData.title,
        exportedAt: new Date().toISOString(),
        metadata: exportData.metadata,
        summary: exportData.data.length > 0 ? this.generateSummaryData(exportData.data) : [],
        data: exportData.data,
        analytics: {
          totalRecords: exportData.data.length,
          fields: exportData.data.length > 0 ? Object.keys(exportData.data[0]) : [],
          dataTypes: exportData.data.length > 0 ? this.analyzeDataTypes(exportData.data[0]) : {}
        }
      };
      
      const blob = new Blob([JSON.stringify(jsonData, null, 2)], { 
        type: 'application/json' 
      });
      
      this.downloadFile(blob, `${filename}.json`);
    } catch (error) {
      throw new Error('JSON export failed');
    }
  }

  private async exportToPDF(exportData: ExportData, filename: string, options: ExportOptions): Promise<void> {
    try {
      if (!exportData.data || exportData.data.length === 0) {
        throw new Error('No data available to export to PDF');
      }

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      doc.setFontSize(22);
      doc.setTextColor(31, 41, 55);
      doc.text(exportData.title || 'Data Export', pageWidth / 2, 20, { align: 'center' });

      doc.setFontSize(12);
      doc.setTextColor(107, 114, 128);
      const dateStr = `Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`;
      doc.text(dateStr, pageWidth / 2, 30, { align: 'center' });

      let yPos = 40;

      if (exportData.metadata && options.includeMetadata) {
        doc.setFillColor(248, 250, 252);
        doc.rect(15, yPos, pageWidth - 30, 25, 'F');
        doc.setTextColor(31, 41, 55);
        doc.setFontSize(14);
        doc.text('Export Information', 20, yPos + 8);

        doc.setFontSize(10);
        doc.setTextColor(107, 114, 128);
        doc.text(`Generated by: ${exportData.metadata.generatedBy || 'Statsor Analytics'}`, 20, yPos + 15);
        doc.text(`Total records: ${exportData.data.length}`, 20, yPos + 20);

        yPos += 35;
      }

      const summary = this.generateSummaryData(exportData.data);

      if (summary.length > 0) {
        doc.setFontSize(16);
        doc.setTextColor(31, 41, 55);
        doc.text('Summary Statistics', 15, yPos);
        yPos += 10;

        (doc as any).autoTable({
          head: [['Metric', 'Value']],
          body: summary.map(item => [String(item.Metric), String(item.Value)]),
          startY: yPos,
          margin: { left: 15, right: 15 },
          styles: {
            fontSize: 8,
            cellPadding: 3,
            overflow: 'linebreak'
          },
          headStyles: {
            fillColor: [74, 222, 128],
            textColor: [255, 255, 255],
            fontStyle: 'bold'
          },
          alternateRowStyles: {
            fillColor: [248, 250, 252]
          }
        });

        yPos = (doc as any).lastAutoTable.finalY + 15;
      }

      doc.setFontSize(16);
      doc.setTextColor(31, 41, 55);

      if (yPos > doc.internal.pageSize.getHeight() - 40) {
        doc.addPage();
        yPos = 20;
      }

      doc.text('Detailed Data', 15, yPos);
      yPos += 10;

      const headers = Object.keys(exportData.data[0]);
      const rows = exportData.data.map(row =>
        headers.map(header => {
          const value = row[header];
          if (value === null || value === undefined) return '';
          return String(value);
        })
      );

      (doc as any).autoTable({
        head: [headers],
        body: rows,
        startY: yPos,
        margin: { left: 15, right: 15 },
        styles: {
          fontSize: 8,
          cellPadding: 3,
          overflow: 'linebreak',
          cellWidth: 'wrap'
        },
        headStyles: {
          fillColor: [74, 222, 128],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        columnStyles: headers.reduce((acc, header, index) => {
          acc[index] = { cellWidth: 'auto' };
          return acc;
        }, {} as any)
      });

      doc.save(`${filename}.pdf`);
    } catch (error: any) {
      console.error('PDF export error:', error);
      const errorMsg = error?.message || 'Unknown error';
      throw new Error(`PDF export failed: ${errorMsg}`);
    }
  }

  private generateSummaryData(data: any[]): any[] {
    if (data.length === 0) return [];

    const summary = [];
    const firstItem = data[0];
    
    // Basic statistics
    summary.push({ Metric: 'Total Records', Value: data.length });
    
    // Analyze numeric fields
    Object.keys(firstItem).forEach(key => {
      const values = data.map(item => item[key]).filter(val => typeof val === 'number' && !isNaN(val));
      
      if (values.length > 0) {
        const sum = values.reduce((a, b) => a + b, 0);
        const avg = sum / values.length;
        const max = Math.max(...values);
        const min = Math.min(...values);
        
        summary.push(
          { Metric: `${key} - Average`, Value: avg.toFixed(2) },
          { Metric: `${key} - Maximum`, Value: max },
          { Metric: `${key} - Minimum`, Value: min },
          { Metric: `${key} - Total`, Value: sum.toFixed(2) }
        );
      }
    });

    return summary;
  }

  private analyzeDataTypes(sampleRow: any): Record<string, string> {
    const types: Record<string, string> = {};
    
    Object.entries(sampleRow).forEach(([key, value]) => {
      if (typeof value === 'number') {
        types[key] = 'number';
      } else if (typeof value === 'boolean') {
        types[key] = 'boolean';
      } else if (value instanceof Date) {
        types[key] = 'date';
      } else if (typeof value === 'string') {
        // Check if it's a date string
        if (!isNaN(Date.parse(value))) {
          types[key] = 'date_string';
        } else {
          types[key] = 'string';
        }
      } else {
        types[key] = 'object';
      }
    });

    return types;
  }

  private downloadFile(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL object
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }

  // Export player statistics
  async exportPlayerStats(players: any[], options: Partial<ExportOptions> = {}): Promise<void> {
    const exportData: ExportData = {
      title: 'Player Statistics Report',
      data: players.map(player => ({
        Name: player.name,
        Position: player.position,
        Number: player.number,
        Goals: player.goals || 0,
        Assists: player.assists || 0,
        'Games Played': player.games || 0,
        'Minutes Played': player.minutes || 0,
        'Yellow Cards': player.yellowCards || 0,
        'Red Cards': player.redCards || 0,
        'Pass Accuracy': player.passAccuracy ? `${player.passAccuracy}%` : '0%'
      })),
      metadata: {
        generatedAt: new Date().toISOString(),
        generatedBy: 'Statsor Analytics',
        sport: 'football'
      }
    };

    await this.exportAnalytics(exportData, {
      format: 'excel',
      includeMetadata: true,
      ...options
    });
  }

  // Export match statistics
  async exportMatchStats(matches: any[], options: Partial<ExportOptions> = {}): Promise<void> {
    const exportData: ExportData = {
      title: 'Match Statistics Report',
      data: matches.map(match => ({
        Date: new Date(match.date).toLocaleDateString(),
        'Home Team': match.homeTeam,
        'Away Team': match.awayTeam,
        'Home Score': match.homeScore,
        'Away Score': match.awayScore,
        Venue: match.venue,
        Status: match.status
      })),
      metadata: {
        generatedAt: new Date().toISOString(),
        generatedBy: 'Statsor Analytics',
        sport: 'football'
      }
    };

    await this.exportAnalytics(exportData, {
      format: 'excel',
      includeMetadata: true,
      ...options
    });
  }

  // Export team analytics
  async exportTeamAnalytics(teamData: any, options: Partial<ExportOptions> = {}): Promise<void> {
    const exportData: ExportData = {
      title: 'Team Analytics Report',
      data: [
        { Metric: 'Total Matches', Value: teamData.totalMatches || 0 },
        { Metric: 'Wins', Value: teamData.wins || 0 },
        { Metric: 'Draws', Value: teamData.draws || 0 },
        { Metric: 'Losses', Value: teamData.losses || 0 },
        { Metric: 'Goals For', Value: teamData.goalsFor || 0 },
        { Metric: 'Goals Against', Value: teamData.goalsAgainst || 0 },
        { Metric: 'Win Percentage', Value: `${teamData.winPercentage || 0}%` }
      ],
      metadata: {
        generatedAt: new Date().toISOString(),
        generatedBy: 'Statsor Analytics',
        sport: 'football'
      }
    };

    await this.exportAnalytics(exportData, {
      format: 'pdf',
      includeMetadata: true,
      ...options
    });
  }
}

export const analyticsExportService = new AnalyticsExportService();
export type { ExportData, ExportOptions };

// Test function for PDF generation
export const testPDFGeneration = async () => {
  const testData: ExportData = {
    title: 'Test Report',
    data: [
      { Name: 'John Doe', Age: 25, Position: 'Developer' },
      { Name: 'Jane Smith', Age: 30, Position: 'Designer' },
      { Name: 'Bob Johnson', Age: 35, Position: 'Manager' }
    ],
    metadata: {
      generatedAt: new Date().toISOString(),
      generatedBy: 'Test Script',
      sport: 'Testing'
    }
  };

  try {
    await analyticsExportService.exportAnalytics(testData, {
      format: 'pdf',
      filename: 'test-report',
      includeMetadata: true
    });
    console.log('PDF generation successful!');
  } catch (error) {
    console.error('PDF generation failed:', error);
  }
};

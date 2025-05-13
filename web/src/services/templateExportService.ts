import { ExportTemplate } from '../components/analytics/ExportTemplates';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export interface ExportData {
  [key: string]: any;
}

class TemplateExportService {
  private async exportToPDF(template: ExportTemplate, data: ExportData): Promise<Blob> {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(16);
    doc.text(template.name, 14, 15);
    
    // Add description
    doc.setFontSize(12);
    doc.text(template.description, 14, 25);
    
    // Add metadata
    doc.setFontSize(10);
    doc.text(`Version: ${template.version}`, 14, 35);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 40);
    
    // Add data table
    const tableData = template.fields.map(field => ({
      field,
      value: data[field] || ''
    }));
    
    (doc as any).autoTable({
      startY: 45,
      head: [['Field', 'Value']],
      body: tableData.map(row => [row.field, row.value]),
      theme: 'grid',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [66, 139, 202] }
    });
    
    return doc.output('blob');
  }

  private async exportToCSV(template: ExportTemplate, data: ExportData): Promise<Blob> {
    const headers = template.fields;
    const values = headers.map(field => data[field] || '');
    
    const csvContent = [
      headers.join(','),
      values.join(',')
    ].join('\n');
    
    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  }

  private async exportToExcel(template: ExportTemplate, data: ExportData): Promise<Blob> {
    const worksheet = XLSX.utils.json_to_sheet([
      Object.fromEntries(
        template.fields.map(field => [field, data[field] || ''])
      )
    ]);
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, template.name);
    
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  async exportTemplate(template: ExportTemplate, data: ExportData): Promise<Blob> {
    switch (template.format) {
      case 'pdf':
        return this.exportToPDF(template, data);
      case 'csv':
        return this.exportToCSV(template, data);
      case 'excel':
        return this.exportToExcel(template, data);
      default:
        throw new Error(`Unsupported export format: ${template.format}`);
    }
  }

  async downloadTemplate(template: ExportTemplate, data: ExportData): Promise<void> {
    try {
      const blob = await this.exportTemplate(template, data);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${template.name}.${template.format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting template:', error);
      throw error;
    }
  }
}

export const templateExportService = new TemplateExportService(); 
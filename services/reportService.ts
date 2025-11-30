import { jsPDF } from "jspdf";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { PatientRecord } from "../shared/types/index.ts";

export const generateHandoverReport = (records: PatientRecord[], date: Date, doctorName: string) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;
  let yPos = 20;

  // Header
  doc.setFontSize(18);
  doc.text("Reporte de Entrega de Turno", margin, yPos);
  yPos += 10;
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Fecha: ${format(date, "EEEE d 'de' MMMM, yyyy", { locale: es })}`, margin, yPos);
  doc.text(`Médico: ${doctorName}`, margin + 100, yPos);
  yPos += 15;

  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  // Content
  if (records.length === 0) {
    doc.text("No hay pacientes registrados para esta fecha.", margin, yPos);
  } else {
    records.forEach((patient, index) => {
      // Check page break
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }

      // Patient Header
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.setFont("helvetica", "bold");
      doc.text(`${index + 1}. ${patient.name} (${patient.rut})`, margin, yPos);
      
      // Type Tag simulation
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.setFont("helvetica", "normal");
      doc.text(`[${patient.type}]`, margin + 120, yPos);
      
      yPos += 6;

      // Diagnosis
      doc.setFontSize(10);
      doc.setTextColor(50);
      doc.text(`Dg: ${patient.diagnosis}`, margin + 5, yPos);
      yPos += 6;

      // Note (Truncated)
      if (patient.clinicalNote) {
        const splitNote = doc.splitTextToSize(`Nota: ${patient.clinicalNote}`, pageWidth - (margin * 2) - 5);
        doc.text(splitNote, margin + 5, yPos);
        yPos += (splitNote.length * 5);
      }

      // Pendings
      const activeTasks = patient.pendingTasks.filter(t => !t.isCompleted);
      if (activeTasks.length > 0) {
        yPos += 2;
        doc.setFont("helvetica", "bold");
        doc.text("Pendientes:", margin + 5, yPos);
        yPos += 5;
        doc.setFont("helvetica", "normal");
        
        activeTasks.forEach(task => {
           doc.text(`• ${task.text}`, margin + 10, yPos);
           yPos += 5;
        });
      }

      yPos += 8; // Spacing between patients
    });
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for(let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Generado por MediDiario AI - Página ${i} de ${pageCount}`, margin, doc.internal.pageSize.height - 10);
  }

  doc.save(`entrega_turno_${format(date, "yyyy-MM-dd")}.pdf`);
};
import jsPDF from 'jspdf';

/**
 * Generates a PDF prescription with CureConnect branding
 * @param {Object} prescription - The prescription data
 * @param {Object} doctor - The doctor data
 * @param {Object} appointment - The appointment data
 * @returns {Blob} - The generated PDF as a Blob
 */
export const generatePrescriptionPDF = (prescription, doctor) => {
  // Initialize PDF document (A4 size)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  // Set document properties
  doc.setProperties({
    title: `Prescription for ${prescription.patientName}`,
    subject: 'Medical Prescription',
    author: doctor.name,
    creator: 'CureConnect'
  });
  
  // Add CureConnect header
  doc.setFillColor(41, 82, 156); // CureConnect blue
  doc.rect(0, 0, 210, 25, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('CureConnect', 105, 15, { align: 'center' });
  
  // Reset text color for rest of document
  doc.setTextColor(0, 0, 0);
  
  // Add prescription title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Medical Prescription', 105, 35, { align: 'center' });
  
  // Add horizontal line
  doc.setDrawColor(41, 82, 156);
  doc.setLineWidth(0.5);
  doc.line(20, 40, 190, 40);
  
  // Doctor information
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Doctor:', 20, 50);
  doc.setFont('helvetica', 'normal');
  doc.text(`Dr. ${doctor.name}`, 50, 50);
  doc.text(`Specialization: ${doctor.specialization || 'Specialist'}`, 50, 56);
  doc.text(`Education: ${doctor.education || 'Not specified'}`, 50, 62);
  doc.text(`Address: ${doctor.location || 'Not specified'}`, 50, 68);
  
  // Patient information
  doc.setFont('helvetica', 'bold');
  doc.text('Patient:', 20, 84);
  doc.setFont('helvetica', 'normal');
  doc.text(`${prescription.patientId.name}`, 50, 84);
  
  // Appointment information
  doc.setFont('helvetica', 'bold');
  doc.text('Date:', 20, 94);
  doc.setFont('helvetica', 'normal');
  const prescriptionDate = new Date(prescription.createdAt || prescription.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  doc.text(prescriptionDate, 50, 94);
  
  // Add horizontal line
  doc.line(20, 102, 190, 102);
  
  // Medications section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Medications', 20, 112);
  
  // Medications table headers
  doc.setFontSize(11);
  doc.text('Medication', 20, 122);
  doc.text('Dosage', 80, 122);
  doc.text('Frequency', 120, 122);
  doc.text('Duration', 160, 122);
  
  // Draw line under headers
  doc.setLineWidth(0.2);
  doc.line(20, 124, 190, 124);
  
  // Medications table content
  doc.setFont('helvetica', 'normal');
  let yPos = 132;
  
  if (prescription.medications && prescription.medications.length > 0) {
    prescription.medications.forEach((med, index) => {
      doc.text(med.name || '', 20, yPos);
      doc.text(med.dosage || '', 80, yPos);
      doc.text(med.frequency || '', 120, yPos);
      doc.text(med.duration || '', 160, yPos);
      yPos += 10;
      
      // Add a light line between medications
      if (index < prescription.medications.length - 1) {
        doc.setDrawColor(200, 200, 200);
        doc.line(20, yPos - 5, 190, yPos - 5);
        doc.setDrawColor(41, 82, 156);
      }
    });
  } else {
    doc.text('No medications prescribed', 20, yPos);
    yPos += 10;
  }
  
  // Add horizontal line after medications
  doc.setDrawColor(41, 82, 156);
  doc.setLineWidth(0.5);
  doc.line(20, yPos, 190, yPos);
  yPos += 10;
  
  // Notes section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Notes', 20, yPos);
  yPos += 10;
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  
  // Handle multiline notes with word wrapping
  if (prescription.notes && prescription.notes.trim() !== '') {
    const splitNotes = doc.splitTextToSize(prescription.notes, 170);
    doc.text(splitNotes, 20, yPos);
    yPos += splitNotes.length * 7 + 10;
  } else {
    doc.text('No additional notes', 20, yPos);
    yPos += 10;
  }
  
  // Doctor's signature
  yPos = Math.max(yPos, 220); // Ensure there's enough space for signature
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text("Doctor's Signature:", 20, yPos);
  
  
  // Add doctor's name in CAPITAL LETTERS as e-signature
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`DR. ${doctor.name.toUpperCase()}`, 75, yPos + 20, { align: 'center' });
  
  // Add signature line
  doc.setDrawColor(0, 0, 0);
  doc.line(50, yPos + 15, 100, yPos + 15);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('(Electronic Signature)', 75, yPos + 25, { align: 'center' });
  
  // Add footer
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('This is an electronically generated prescription from CureConnect.', 105, 280, { align: 'center' });
  doc.text('© CureConnect - Connecting Care, Everywhere', 105, 285, { align: 'center' });
  
  // Return the PDF as a blob
  return doc.output('blob');
};
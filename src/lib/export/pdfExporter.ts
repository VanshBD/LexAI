import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Exports text or an HTML container element to a downloadable PDF file.
 *
 * @param content - Plain text string or an HTMLElement to render.
 * @param filename - Target filename (e.g., 'lexai-summary.pdf').
 */
export async function exportToPdf(
  content: string | HTMLElement,
  filename = 'lexai-document.pdf'
): Promise<void> {
  const safeFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;

  if (typeof content === 'string') {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4',
    });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    const splitText = doc.splitTextToSize(content, 500);
    let cursorY = 40;

    for (let i = 0; i < splitText.length; i++) {
      if (cursorY > 780) {
        doc.addPage();
        cursorY = 40;
      }
      doc.text(splitText[i], 40, cursorY);
      cursorY += 14;
    }

    doc.save(safeFilename);
  } else {
    // HTML element capture
    const canvas = await html2canvas(content, {
      scale: 2,
      useCORS: true,
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210;
    const pageHeight = 295;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(safeFilename);
  }
}

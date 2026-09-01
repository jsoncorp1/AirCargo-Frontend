import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export interface PDFExportOptions {
  filename?: string;
  format?: 'a4' | 'letter' | [number, number];
  orientation?: 'portrait' | 'landscape';
}

/**
 * Convierte un elemento HTML en un archivo PDF descargable.
 * @param element El HTMLElement que se desea exportar
 * @param options Opciones de formato y nombre del archivo
 */
export async function exportElementToPDF(
  element: HTMLElement,
  options: PDFExportOptions = {}
): Promise<void> {
  const {
    filename = 'documento.pdf',
    format = 'letter',
    orientation = 'portrait',
  } = options;

  try {
    // Renderear el HTML a un Canvas con alta resolución (escala 2)
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/png');

    // Inicializar jsPDF
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format,
    });

    // Dimensiones de la página
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    // Calcular proporciones de la imagen
    const imgProps = pdf.getImageProperties(imgData);
    const imgRatio = imgProps.width / imgProps.height;
    
    // Dimensiones en el PDF
    const renderWidth = pdfWidth;
    const renderHeight = pdfWidth / imgRatio;

    // Si el contenido es más largo que una página, se puede manejar multipágina (básico)
    // Para recibos y guías, normalmente entra en una sola, pero si sobrepasa, cortamos u escalamos.
    if (renderHeight > pdfHeight) {
       // Escalar para que entre completo en la página
       const scaledWidth = pdfHeight * imgRatio;
       const xOffset = (pdfWidth - scaledWidth) / 2; // centrar
       pdf.addImage(imgData, 'PNG', xOffset, 0, scaledWidth, pdfHeight);
    } else {
       pdf.addImage(imgData, 'PNG', 0, 0, renderWidth, renderHeight);
    }

    pdf.save(filename);
  } catch (error) {
    console.error('Error generando PDF:', error);
    throw new Error('No se pudo generar el documento PDF.');
  }
}

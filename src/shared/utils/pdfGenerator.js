import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Función auxiliar para convertir URL a Base64
const getBase64FromUrl = async (url) => {
  const data = await fetch(url);
  const blob = await data.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob); 
    reader.onloadend = () => resolve(reader.result);
  });
};

// Ahora la función es ASYNC para poder cargar la imagen
export const generateDocumentPDF = async (sale, company, items) => {
  const doc = new jsPDF();
  
  // Colores Corporativos
  const colorPrimary = [0, 160, 220]; // #00A0DC
  const colorSecondary = [60, 60, 60]; 
  const colorLight = [245, 245, 245]; 

  let title = 'DOCUMENTO';
  if (sale.type === 'factura') title = 'FACTURA ELECTRÓNICA';
  else if (sale.type === 'boleta') title = 'BOLETA ELECTRÓNICA';
  else if (sale.type === 'cotizacion') title = 'COTIZACIÓN';

  // --- 1. CABECERA ---
  
  // LOGO: Intentamos cargarlo
  if (company.logo_url) {
    try {
      const imgData = await getBase64FromUrl(company.logo_url);
      // Añadimos la imagen (data, formato, x, y, ancho, alto)
      doc.addImage(imgData, 'PNG', 14, 10, 30, 30); 
    } catch (e) {
      console.warn("No se pudo cargar el logo para el PDF", e);
    }
  }

  // Ajustamos la posición Y del texto si hay logo
  const headerTextY = 20; 

  doc.setDrawColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
  doc.setLineWidth(1.5);
  doc.line(10, 15, 10, 45);

  doc.setFontSize(18);
  doc.setTextColor(colorSecondary[0], colorSecondary[1], colorSecondary[2]);
  doc.setFont("helvetica", "bold");
  // Movemos un poco a la derecha si hay logo, o lo dejamos en 50 si queremos que no se solape
  const textX = company.logo_url ? 50 : 14; 
  doc.text((company.company_name || 'MI EMPRESA').toUpperCase(), textX, 20);
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80);
  doc.text(`RUT: ${company.rut || 'Sin RUT'}`, textX, 26);
  doc.text(company.address || 'Dirección Comercial', textX, 31);
  doc.text(`Tel: ${company.phone || '-'} | ${company.email || ''}`, textX, 36);
  doc.text(company.activity || 'Giro Comercial', textX, 41);

  // ... (El resto del código del PDF se mantiene igual que la versión anterior)
  // Recuadro Derecho
  const rightColX = 140;
  doc.setFillColor(colorLight[0], colorLight[1], colorLight[2]);
  doc.rect(rightColX, 10, 60, 35, 'F'); 
  doc.setDrawColor(200); 
  doc.rect(rightColX, 10, 60, 35); 

  doc.setTextColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("R.U.T.: " + (company.rut || '99.999.999-9'), rightColX + 30, 18, { align: 'center' });
  
  doc.setFontSize(12);
  doc.text(title, rightColX + 30, 26, { align: 'center' });
  
  doc.setTextColor(0);
  doc.setFontSize(10);
  doc.text(`Nº ${sale.receipt_number || '00001'}`, rightColX + 30, 34, { align: 'center' });
  
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(`FECHA: ${new Date(sale.created_at).toLocaleDateString('es-CL')}`, rightColX + 30, 41, { align: 'center' });

  // Datos Cliente
  const client = sale.client_snapshot || {};
  const clientY = 55;
  doc.setFillColor(colorLight[0], colorLight[1], colorLight[2]);
  doc.rect(14, clientY - 4, 186, 24, 'F');

  doc.setFontSize(10);
  doc.setTextColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
  doc.setFont("helvetica", "bold");
  doc.text("FACTURAR A:", 18, clientY + 2);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(60);
  
  doc.setFont("helvetica", "bold");
  doc.text((client.name || 'Cliente Mostrador').toUpperCase(), 18, clientY + 8);
  doc.setFont("helvetica", "normal");
  doc.text(`RUT: ${client.tax_id || 'N/A'}`, 18, clientY + 14);
  doc.text(`Dirección: ${client.address || 'Ciudad, País'}`, 100, clientY + 8);
  if (client.phone) doc.text(`Tel: ${client.phone}`, 100, clientY + 14);

  // Tabla
  const tableRows = items.map(item => {
    const precioBrutoUnitario = item.unit_price;
    const precioNetoUnitario = Math.round(precioBrutoUnitario / 1.19);
    const cantidad = item.quantity;
    const totalBruto = precioBrutoUnitario * cantidad;
    const totalNeto = precioNetoUnitario * cantidad;
    const totalIva = totalBruto - totalNeto;

    return [
      cantidad,
      item.product_name,
      `$ ${precioNetoUnitario.toLocaleString('es-CL')}`, 
      `$ ${totalNeto.toLocaleString('es-CL')}`,         
      `$ ${totalIva.toLocaleString('es-CL')}`,          
      `$ ${totalBruto.toLocaleString('es-CL')}`         
    ];
  });

  autoTable(doc, {
    startY: clientY + 25,
    head: [["CANT.", "DESCRIPCIÓN", "P. UNIT (NETO)", "TOTAL NETO", "IVA (19%)", "TOTAL"]],
    body: tableRows,
    theme: 'grid', 
    headStyles: { fillColor: colorPrimary, textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center', fontSize: 9 },
    styles: { fontSize: 9, cellPadding: 3, textColor: [50, 50, 50], valign: 'middle' },
    columnStyles: {
      0: { halign: 'center', cellWidth: 15 }, 
      2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' }, 
      5: { halign: 'right', fontStyle: 'bold', textColor: [0, 0, 0] }  
    }
  });

  // Totales
  const finalY = doc.lastAutoTable.finalY + 10;
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
  doc.text("Términos y Instrucciones:", 14, finalY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(80);
  doc.text(["Forma de pago: Contado / Transferencia.", "Garantía según boleta.", "Gracias por su preferencia."], 14, finalY + 6);

  const totalsData = [
    ['SUBTOTAL NETO', `$ ${sale.net_amount?.toLocaleString('es-CL')}`],
    ['DESCUENTO', '$ 0'],
    ['IVA (19%)', `$ ${sale.tax_amount?.toLocaleString('es-CL')}`],
    ['TOTAL A PAGAR', `$ ${sale.total_amount?.toLocaleString('es-CL')}`]
  ];

  autoTable(doc, {
    startY: finalY - 5,
    body: totalsData,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 2, halign: 'right' },
    columnStyles: { 0: { fontStyle: 'bold', textColor: [80, 80, 80] }, 1: { halign: 'right', cellWidth: 35 } },
    margin: { left: 110 }, 
    didParseCell: (data) => {
      if (data.row.index === 3) {
        data.cell.styles.fontSize = 14;
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.textColor = colorPrimary;
        data.cell.styles.fillColor = [240, 248, 255];
      }
    }
  });

  // Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setDrawColor(200);
  doc.line(14, pageHeight - 20, 196, pageHeight - 20);
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(150);
  doc.text("Documento generado electrónicamente", 105, pageHeight - 15, { align: 'center' });
  doc.text(`${company.company_name} - ${company.email}`, 105, pageHeight - 10, { align: 'center' });

  doc.save(`${sale.type}_${sale.receipt_number || Date.now()}.pdf`);
};
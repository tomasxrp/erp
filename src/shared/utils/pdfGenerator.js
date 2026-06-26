import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const getBase64FromUrl = async (url) => {
  try {
    const data = await fetch(url);
    const blob = await data.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => resolve(reader.result);
    });
  } catch (e) {
    console.warn('Error cargando imagen base64', e);
    return null;
  }
};

export const generateDocumentPDF = async (sale, company, items) => {
  const doc = new jsPDF();

  const colorPrimary = [0, 160, 220];
  const colorSecondary = [60, 60, 60];
  const colorLight = [245, 245, 245];

  const totalAmount = Number(sale.total_amount || 0);
  const netAmount = sale.net_amount !== undefined && sale.net_amount !== null ? Number(sale.net_amount) : Math.round(totalAmount / 1.19);
  const taxAmount = sale.tax_amount !== undefined && sale.tax_amount !== null ? Number(sale.tax_amount) : (totalAmount - netAmount);

  // Tipo y número de documento
  let title = 'DOCUMENTO';
  let documentNumber = sale.receipt_number || '00000';

  if (sale.type === 'factura') {
    title = 'FACTURA ELECTRÓNICA';
  } else if (sale.type === 'boleta') {
    title = 'BOLETA ELECTRÓNICA';
  } else if (sale.type === 'cotizacion') {
    title = 'COTIZACIÓN';
    if (sale.quote_number_manual && sale.quote_number_manual.trim() !== '') {
      documentNumber = sale.quote_number_manual;
    }
  }

  // ─────────────────────────────────────────────
  // CABECERA: Logo + datos empresa + recuadro derecho
  // ─────────────────────────────────────────────
  const pageWidth = doc.internal.pageSize.width; // 210
  const rightBoxW = 62;
  const rightBoxX = pageWidth - rightBoxW - 10; // ~138
  const leftMaxX = rightBoxX - 4;               // límite de texto izquierdo

  let logoEndY = 10; // Y donde termina el logo (si hay)
  let logoW = 0;

  if (company.logo_url) {
    try {
      const imgData = await getBase64FromUrl(company.logo_url);
      if (imgData) {
        logoW = 28;
        doc.addImage(imgData, 'PNG', 14, 10, logoW, 28);
        logoEndY = 38;
      }
    } catch (e) {
      console.warn('No se pudo cargar el logo', e);
    }
  }

  // Texto de empresa — empieza a la derecha del logo (o en x=14 si no hay logo)
  const textStartX = logoW > 0 ? 14 + logoW + 4 : 14;

  // Nombre empresa — con wrap automático si es muy largo
  doc.setFontSize(14);
  doc.setTextColor(colorSecondary[0], colorSecondary[1], colorSecondary[2]);
  doc.setFont('helvetica', 'bold');

  const companyName = (company.company_name || 'MI EMPRESA').toUpperCase();
  const maxNameWidth = leftMaxX - textStartX - 2;

  // splitTextToSize para salto de línea automático
  const nameLines = doc.splitTextToSize(companyName, maxNameWidth);
  doc.text(nameLines, textStartX + 2, 20);

  // Ajustar Y base según cuántas líneas ocupó el nombre
  const nameLineH = 6; // approx px por línea a 14pt
  const afterNameY = 20 + (nameLines.length - 1) * nameLineH + 2;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80);

  const infoLines = [
    `RUT: ${company.rut || 'Sin RUT'}`,
    company.address || 'Dirección Comercial',
    `Tel: ${company.phone || '-'} | ${company.email || ''}`,
    company.activity || 'Giro Comercial',
  ];

  // Truncar cada línea para que no sobrepase el límite del recuadro derecho
  infoLines.forEach((line, i) => {
    const truncated = doc.splitTextToSize(line, maxNameWidth)[0]; // solo primera línea
    doc.text(truncated, textStartX + 2, afterNameY + 5 + i * 4.5);
  });

  // Calcular altura del bloque izquierdo para ajustar recuadro derecho
  const leftBlockH = afterNameY + 5 + infoLines.length * 4.5 - 10;
  const rightBoxH = Math.max(leftBlockH, 36);

  // Recuadro derecho
  doc.setFillColor(colorLight[0], colorLight[1], colorLight[2]);
  doc.rect(rightBoxX, 10, rightBoxW, rightBoxH, 'F');
  doc.setDrawColor(200);
  doc.rect(rightBoxX, 10, rightBoxW, rightBoxH);

  doc.setTextColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`R.U.T.: ${company.rut || '99.999.999-9'}`, rightBoxX + rightBoxW / 2, 18, { align: 'center' });

  doc.setFontSize(10);
  doc.text(title, rightBoxX + rightBoxW / 2, 25, { align: 'center' });

  doc.setTextColor(0);
  doc.setFontSize(9);
  doc.text(`Nº ${documentNumber}`, rightBoxX + rightBoxW / 2, 32, { align: 'center' });

  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text(
    `FECHA: ${new Date(sale.created_at || new Date()).toLocaleDateString('es-CL')}`,
    rightBoxX + rightBoxW / 2, 39, { align: 'center' }
  );

  // ─────────────────────────────────────────────
  // SECCIÓN CLIENTE
  // ─────────────────────────────────────────────
  const headerBottom = Math.max(logoEndY, afterNameY + 5 + infoLines.length * 4.5, 10 + rightBoxH) + 6;
  const clientY = headerBottom;

  const client = sale.client_snapshot || {};

  doc.setFillColor(colorLight[0], colorLight[1], colorLight[2]);
  doc.rect(14, clientY, 186, 30, 'F');

  doc.setFontSize(9);
  doc.setTextColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
  doc.setFont('helvetica', 'bold');
  doc.text('INFORMACIÓN DEL CLIENTE:', 18, clientY + 6);

  doc.setFontSize(8);
  doc.setTextColor(60);

  // Columna Izquierda
  doc.setFont('helvetica', 'bold');
  doc.text('Cliente:', 18, clientY + 13);
  doc.text('Dirección:', 18, clientY + 19);
  doc.text('Teléfono:', 18, clientY + 25);

  doc.setFont('helvetica', 'normal');
  doc.text((client.name || 'Cliente General').toUpperCase(), 36, clientY + 13);
  doc.text(client.address || 'No especificada', 36, clientY + 19);
  doc.text(client.phone || 'No especificado', 36, clientY + 25);

  // Columna Derecha
  doc.setFont('helvetica', 'bold');
  doc.text('RUT:', 115, clientY + 13);
  doc.text('Ciudad:', 115, clientY + 19);
  doc.text('Email:', 115, clientY + 25);

  doc.setFont('helvetica', 'normal');
  doc.text(client.tax_id || 'No registrado', 128, clientY + 13);
  doc.text(client.city || 'No registrada', 128, clientY + 19);
  doc.text(client.email || 'No registrado', 128, clientY + 25);

  // ─────────────────────────────────────────────
  // TABLA DE ÍTEMS
  // ─────────────────────────────────────────────
  const tableStartY = clientY + 34;

  const tableRows = items.map(item => {
    const cantidad = item.quantity;
    let precioNetoUnitario;
    let totalNeto;

    if (sale.type === 'cotizacion') {
      precioNetoUnitario = item.unit_price;
      totalNeto = precioNetoUnitario * cantidad;
    } else {
      const precioBrutoUnitario = item.unit_price;
      precioNetoUnitario = Math.round(precioBrutoUnitario / 1.19);
      totalNeto = precioNetoUnitario * cantidad;
    }

    return [
      cantidad,
      item.product_name,
      `$ ${precioNetoUnitario.toLocaleString('es-CL')}`,
      `$ ${totalNeto.toLocaleString('es-CL')}`,
      `$ ${totalNeto.toLocaleString('es-CL')}`,
    ];
  });

  autoTable(doc, {
    startY: tableStartY,
    head: [['CANT.', 'DESCRIPCIÓN', 'P. UNIT (NETO)', 'TOTAL NETO', 'TOTAL']],
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: colorPrimary, textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center', fontSize: 8.5 },
    styles: { fontSize: 8.5, cellPadding: 2.5, textColor: [50, 50, 50], valign: 'middle' },
    columnStyles: {
      0: { halign: 'center', cellWidth: 14 },
      2: { halign: 'right' }, 3: { halign: 'right' },
      4: { halign: 'right', fontStyle: 'bold', textColor: [0, 0, 0] }
    }
  });

  // ─────────────────────────────────────────────
  // TOTALES
  // ─────────────────────────────────────────────
  const finalY = doc.lastAutoTable.finalY + 6;

  const totalsData = [
    ['SUBTOTAL NETO', `$ ${netAmount.toLocaleString('es-CL')}`],
    ['IVA (19%)', `$ ${taxAmount.toLocaleString('es-CL')}`],
    ['TOTAL', `$ ${totalAmount.toLocaleString('es-CL')}`],
  ];

  autoTable(doc, {
    startY: finalY,
    body: totalsData,
    theme: 'plain',
    styles: { fontSize: 9.5, cellPadding: 1.8, halign: 'right' },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: [80, 80, 80] },
      1: { halign: 'right', cellWidth: 36 }
    },
    margin: { left: 115 },
    didParseCell: (data) => {
      if (data.row.index === 2) {
        data.cell.styles.fontSize = 13;
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.textColor = colorPrimary;
      }
    }
  });

  // ─────────────────────────────────────────────
  // CONDICIONES (cotización) o pie de página general
  // ─────────────────────────────────────────────
  const pageHeight = doc.internal.pageSize.height;
  const conditionsStartY = doc.lastAutoTable.finalY + 10;

  if (sale.type === 'cotizacion') {
    const conditionsText = sale.quote_conditions || '';
    const paymentText = sale.quote_payment_method || '';
    const additionalText = sale.quote_additional_info || '';

    let currentY = conditionsStartY;

    doc.setDrawColor(200);
    doc.line(14, currentY - 2, 196, currentY - 2);

    if (conditionsText) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
      doc.text('CONDICIONES DE LA COTIZACIÓN:', 14, currentY + 3);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(70);
      const condLines = doc.splitTextToSize(conditionsText, 175);
      doc.text(condLines, 14, currentY + 8);
      currentY += 8 + condLines.length * 4.2;
    }

    if (paymentText) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
      doc.text('FORMA DE PAGO:', 14, currentY + 3);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(70);
      const payLines = doc.splitTextToSize(paymentText, 175);
      doc.text(payLines, 14, currentY + 8);
      currentY += 8 + payLines.length * 4.2;
    }

    if (additionalText) {
      currentY += 2;
      const boxWidth = 182; // 196 - 14
      const textLines = doc.splitTextToSize(additionalText, boxWidth - 8);
      const boxHeight = 10 + textLines.length * 4.2;

      // Draw a neat gray box
      doc.setFillColor(248, 250, 252); // light slate background
      doc.rect(14, currentY, boxWidth, boxHeight, 'F');
      doc.setDrawColor(226, 232, 240); // light border
      doc.rect(14, currentY, boxWidth, boxHeight);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
      doc.text('INFORMACIÓN ADICIONAL / DATOS DE TRANSFERENCIA:', 18, currentY + 5);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(70);
      doc.text(textLines, 18, currentY + 10);
    }
  } else {
    // Boleta / Factura — pie estándar
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(150);
    doc.text(['Gracias por su preferencia.', 'Documento válido para efectos tributarios.'], 14, conditionsStartY + 3);
  }

  // Pie de página
  doc.setDrawColor(200);
  doc.line(14, pageHeight - 18, 196, pageHeight - 18);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(150);
  doc.text(`${company.company_name || ''} · ${company.email || ''}`, 105, pageHeight - 10, { align: 'center' });

  doc.save(`${sale.type}_${documentNumber}.pdf`);
};


// ─────────────────────────────────────────────
// LIQUIDACIÓN DE SUELDO (sin cambios)
// ─────────────────────────────────────────────
export const generatePayrollPDF = (payroll, employee, company) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  const colorPrimary = [30, 41, 59];
  const colorAccent = [59, 130, 246];

  doc.setFontSize(16);
  doc.setTextColor(...colorPrimary);
  doc.setFont('helvetica', 'bold');
  doc.text('LIQUIDACIÓN DE SUELDO', pageWidth / 2, 20, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Periodo: ${payroll.period_date}`, pageWidth / 2, 26, { align: 'center' });

  doc.setDrawColor(200);
  doc.setFillColor(250);

  doc.rect(14, 35, 85, 35, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text('EMPLEADOR', 18, 42);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(company.company_name || 'Mi Empresa', 18, 48);
  doc.text(company.rut || '', 18, 53);
  doc.text(company.address || '', 18, 58);

  doc.rect(110, 35, 85, 35, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('TRABAJADOR', 114, 42);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(employee.full_name, 114, 48);
  doc.text(`RUT: ${employee.employee_details?.rut || 'N/A'}`, 114, 53);
  doc.text(`Cargo: ${employee.employee_details?.job_title || 'N/A'}`, 114, 58);

  let finalY = 80;
  const rows = [];

  rows.push([{ content: 'HABERES (INGRESOS)', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [240, 248, 255] } }]);
  rows.push(['Sueldo Base', `$ ${parseInt(payroll.base_salary).toLocaleString()}`]);

  let totalBonos = 0;
  if (payroll.bonuses && payroll.bonuses.length > 0) {
    payroll.bonuses.forEach(b => {
      rows.push([b.concept, `$ ${parseInt(b.amount).toLocaleString()}`]);
      totalBonos += parseInt(b.amount);
    });
  }

  rows.push([{ content: 'DESCUENTOS', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [255, 240, 240] } }]);
  let totalDescuentos = 0;
  if (payroll.deductions && payroll.deductions.length > 0) {
    payroll.deductions.forEach(d => {
      rows.push([d.concept, `$ -${parseInt(d.amount).toLocaleString()}`]);
      totalDescuentos += parseInt(d.amount);
    });
  }

  const totalLiquido = parseInt(payroll.base_salary) + totalBonos - totalDescuentos;
  rows.push([{ content: '', colSpan: 2, styles: { fillColor: [255, 255, 255] } }]);
  rows.push([
    { content: 'TOTAL A PAGAR (LÍQUIDO)', styles: { fontStyle: 'bold', fontSize: 12, textColor: colorAccent } },
    { content: `$ ${totalLiquido.toLocaleString()}`, styles: { fontStyle: 'bold', fontSize: 12, textColor: colorAccent, halign: 'right' } }
  ]);

  autoTable(doc, {
    startY: finalY,
    body: rows,
    theme: 'grid',
    styles: { cellPadding: 3 },
    columnStyles: { 0: { cellWidth: 130 }, 1: { cellWidth: 50, halign: 'right' } }
  });

  const pageHeight = doc.internal.pageSize.height;
  const firmaY = pageHeight - 40;

  doc.line(30, firmaY, 90, firmaY);
  doc.text('Firma Empleador', 60, firmaY + 5, { align: 'center' });
  doc.line(120, firmaY, 180, firmaY);
  doc.text('Firma Trabajador', 150, firmaY + 5, { align: 'center' });
  doc.text('Recibí conforme', 150, firmaY + 10, { align: 'center' });

  doc.save(`Liquidacion_${employee.full_name}_${payroll.period_date}.pdf`);
};
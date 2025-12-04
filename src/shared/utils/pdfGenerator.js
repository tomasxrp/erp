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
    console.warn("Error cargando imagen base64", e);
    return null;
  }
};

export const generateDocumentPDF = async (sale, company, items) => {
  const doc = new jsPDF();
  
  // Colores Corporativos
  const colorPrimary = [0, 160, 220]; // #00A0DC
  const colorSecondary = [60, 60, 60]; 
  const colorLight = [245, 245, 245]; 

  // --- 1. RECÁLCULO DE MONTOS (LA SOLUCIÓN) ---
  // Recalculamos aquí mismo para asegurar que el PDF siempre muestre el IVA correcto,
  // incluso si la base de datos tiene guardado un 0.
  const totalAmount = sale.total_amount || 0;
  const netAmount = Math.round(totalAmount / 1.19);
  const taxAmount = totalAmount - netAmount;

  // --- CONFIGURACIÓN TÍTULO Y NÚMERO ---
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

  // --- CABECERA ---
  if (company.logo_url) {
    try {
      const imgData = await getBase64FromUrl(company.logo_url);
      if (imgData) {
        doc.addImage(imgData, 'PNG', 14, 10, 30, 30); 
      }
    } catch (e) {
      console.warn("No se pudo cargar el logo", e);
    }
  }

  doc.setDrawColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
  doc.setLineWidth(1.5);
  doc.line(10, 15, 10, 45);

  doc.setFontSize(18);
  doc.setTextColor(colorSecondary[0], colorSecondary[1], colorSecondary[2]);
  doc.setFont("helvetica", "bold");
  const textX = company.logo_url ? 50 : 14; 
  
  doc.text((company.company_name || 'MI EMPRESA').toUpperCase(), textX, 20);
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80);
  doc.text(`RUT: ${company.rut || 'Sin RUT'}`, textX, 26);
  doc.text(company.address || 'Dirección Comercial', textX, 31);
  doc.text(`Tel: ${company.phone || '-'} | ${company.email || ''}`, textX, 36);
  doc.text(company.activity || 'Giro Comercial', textX, 41);

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
  doc.text(`Nº ${documentNumber}`, rightColX + 30, 34, { align: 'center' });
  
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(`FECHA: ${new Date(sale.created_at || new Date()).toLocaleDateString('es-CL')}`, rightColX + 30, 41, { align: 'center' });

  // Cliente
  const client = sale.client_snapshot || {};
  const clientY = 55;
  doc.setFillColor(colorLight[0], colorLight[1], colorLight[2]);
  doc.rect(14, clientY - 4, 186, 24, 'F');

  doc.setFontSize(10);
  doc.setTextColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
  doc.setFont("helvetica", "bold");
  doc.text(sale.type === 'cotizacion' ? "COTIZAR A:" : "FACTURAR A:", 18, clientY + 2);
  
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

  // Totales (Usando las variables recalculadas)
  const finalY = doc.lastAutoTable.finalY + 10;
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
  doc.text(sale.type === 'cotizacion' ? "Condiciones:" : "Información:", 14, finalY);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(80);
  
  if (sale.type === 'cotizacion') {
      doc.text(["Validez de la oferta: 15 días.", "Forma de pago: Contado / Transferencia."], 14, finalY + 6);
  } else {
      doc.text(["Gracias por su preferencia.", "Documento válido para efectos tributarios."], 14, finalY + 6);
  }

  const totalsData = [
    ['SUBTOTAL NETO', `$ ${netAmount.toLocaleString('es-CL')}`],
    ['IVA (19%)', `$ ${taxAmount.toLocaleString('es-CL')}`],
    ['TOTAL', `$ ${totalAmount.toLocaleString('es-CL')}`]
  ];

  autoTable(doc, {
    startY: finalY - 5,
    body: totalsData,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 2, halign: 'right' },
    columnStyles: { 0: { fontStyle: 'bold', textColor: [80, 80, 80] }, 1: { halign: 'right', cellWidth: 35 } },
    margin: { left: 110 }, 
    didParseCell: (data) => {
      if (data.row.index === 2) { 
        data.cell.styles.fontSize = 14;
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.textColor = colorPrimary;
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
  doc.text(`${company.company_name} - ${company.email}`, 105, pageHeight - 10, { align: 'center' });

  doc.save(`${sale.type}_${documentNumber}.pdf`);
};


export const generatePayrollPDF = (payroll, employee, company) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  
  // Colores
  const colorPrimary = [30, 41, 59]; // Slate 900
  const colorAccent = [59, 130, 246]; // Blue 500

  // Header
  doc.setFontSize(16);
  doc.setTextColor(...colorPrimary);
  doc.setFont("helvetica", "bold");
  doc.text("LIQUIDACIÓN DE SUELDO", pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Periodo: ${payroll.period_date}`, pageWidth / 2, 26, { align: 'center' });

  // Datos Empresa y Empleado (Recuadros)
  doc.setDrawColor(200);
  doc.setFillColor(250);
  
  // Izq: Empresa
  doc.rect(14, 35, 85, 35, 'F');
  doc.setFont("helvetica", "bold");
  doc.text("EMPLEADOR", 18, 42);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(company.company_name || 'Mi Empresa', 18, 48);
  doc.text(company.rut || '', 18, 53);
  doc.text(company.address || '', 18, 58);

  // Der: Empleado
  doc.rect(110, 35, 85, 35, 'F');
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("TRABAJADOR", 114, 42);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(employee.full_name, 114, 48);
  doc.text(`RUT: ${employee.employee_details?.rut || 'N/A'}`, 114, 53);
  doc.text(`Cargo: ${employee.employee_details?.job_title || 'N/A'}`, 114, 58);

  let finalY = 80;

  // TABLA DETALLES
  const rows = [];
  
  // 1. Haberes (Ingresos)
  rows.push([{ content: 'HABERES (INGRESOS)', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [240, 248, 255] } }]);
  rows.push(['Sueldo Base', `$ ${parseInt(payroll.base_salary).toLocaleString()}`]);
  
  let totalBonos = 0;
  if (payroll.bonuses && payroll.bonuses.length > 0) {
    payroll.bonuses.forEach(b => {
      rows.push([b.concept, `$ ${parseInt(b.amount).toLocaleString()}`]);
      totalBonos += parseInt(b.amount);
    });
  }

  // 2. Descuentos
  rows.push([{ content: 'DESCUENTOS', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [255, 240, 240] } }]);
  let totalDescuentos = 0;
  if (payroll.deductions && payroll.deductions.length > 0) {
    payroll.deductions.forEach(d => {
      rows.push([d.concept, `$ -${parseInt(d.amount).toLocaleString()}`]);
      totalDescuentos += parseInt(d.amount);
    });
  }

  // 3. Totales
  const totalLiquido = parseInt(payroll.base_salary) + totalBonos - totalDescuentos;
  
  rows.push([{ content: '', colSpan: 2, styles: { fillColor: [255, 255, 255] } }]); // Espacio
  rows.push([
    { content: 'TOTAL A PAGAR (LÍQUIDO)', styles: { fontStyle: 'bold', fontSize: 12, textColor: colorAccent } },
    { content: `$ ${totalLiquido.toLocaleString()}`, styles: { fontStyle: 'bold', fontSize: 12, textColor: colorAccent, halign: 'right' } }
  ]);

  autoTable(doc, {
    startY: finalY,
    body: rows,
    theme: 'grid',
    styles: { cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 130 },
      1: { cellWidth: 50, halign: 'right' }
    }
  });

  // Firmas
  const pageHeight = doc.internal.pageSize.height;
  const firmaY = pageHeight - 40;

  doc.line(30, firmaY, 90, firmaY);
  doc.text("Firma Empleador", 60, firmaY + 5, { align: 'center' });

  doc.line(120, firmaY, 180, firmaY);
  doc.text("Firma Trabajador", 150, firmaY + 5, { align: 'center' });
  doc.text("Recibí conforme", 150, firmaY + 10, { align: 'center' });

  doc.save(`Liquidacion_${employee.full_name}_${payroll.period_date}.pdf`);
};
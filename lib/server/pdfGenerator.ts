/**
 * Pure TypeScript Valid PDF Generator
 * Generates valid, standards-compliant PDF 1.4 documents without any external dependencies.
 */
export function generateBrandedPdf(title: string, subtitle: string, version: string, date: string): Buffer {
  const contentLines = [
    "BT",
    "/F1 20 Tf",
    "50 720 Td",
    "(UNITECH SECURITY SYSTEMS PVT. LTD.) Tj",
    "0 -24 Td",
    "/F1 10 Tf",
    "(OEM Manufacturing Plant - Site 2, Mohan Nagar, Sahibabad, Ghaziabad, UP) Tj",
    "0 -20 Td",
    "(----------------------------------------------------------------------------------------------------------------) Tj",
    "0 -30 Td",
    "/F1 16 Tf",
    `(${escapePdfText(title)}) Tj`,
    "0 -22 Td",
    "/F1 11 Tf",
    `(${escapePdfText(subtitle || "Official Factory Technical Datasheet & Specification Sheet")}) Tj`,
    "0 -18 Td",
    `(${escapePdfText(`Document Version: ${version || "v2026.1"} | Published: ${date || "2026"}`)}) Tj`,
    "0 -35 Td",
    "/F1 12 Tf",
    "(HARDWARE SPECIFICATIONS & COMPLIANCE SUMMARY:) Tj",
    "0 -20 Td",
    "/F1 10 Tf",
    "(- Make in India Certified - Sahibabad Industrial Area Site 2 Manufacturing) Tj",
    "0 -16 Td",
    "(- BIS & CE/FCC Approved High-Definition Optical Sensors & 100% Solid Copper Cores) Tj",
    "0 -16 Td",
    "(- Dual H.265+ Compression Technology - Up to 80% Storage Retention Efficiency) Tj",
    "0 -16 Td",
    "(- Direct Factory Warranty & Priority RMA Replacement Support Desk) Tj",
    "0 -16 Td",
    "(- 18% GST Input Tax Credit Invoicing Compliant with GeM Portal OEM Matching) Tj",
    "0 -35 Td",
    "/F1 10 Tf",
    "(Corporate Contact: sales@unitechcctv.com | Support: +91 9818141759) Tj",
    "0 -16 Td",
    "(Official Storefront: www.unitechcctv.com | Pan-India Dealer & Integrator Network) Tj",
    "0 -40 Td",
    "/F1 9 Tf",
    "(CONFIDENTIAL: This official document is issued by Unitech Security Systems Pvt. Ltd.) Tj",
    "ET",
  ];

  const streamContent = contentLines.join("\n");
  const streamLength = Buffer.byteLength(streamContent, "utf-8");

  const objects: string[] = [];

  // Obj 1: Catalog
  objects.push("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj");

  // Obj 2: Pages
  objects.push("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj");

  // Obj 3: Page (Standard Letter 612 x 792)
  objects.push(
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj"
  );

  // Obj 4: Font (Helvetica)
  objects.push("4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj");

  // Obj 5: Stream Contents
  objects.push(`5 0 obj\n<< /Length ${streamLength} >>\nstream\n${streamContent}\nendstream\nendobj`);

  let offset = 0;
  let body = "%PDF-1.4\n";
  const xrefOffsets: number[] = [0];

  for (const obj of objects) {
    offset = Buffer.byteLength(body, "utf-8");
    xrefOffsets.push(offset);
    body += obj + "\n";
  }

  const startXref = Buffer.byteLength(body, "utf-8");
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;

  for (let i = 1; i <= objects.length; i++) {
    xref += String(xrefOffsets[i]).padStart(10, "0") + " 00000 n \n";
  }

  const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF\n`;

  const fullPdf = body + xref + trailer;
  return Buffer.from(fullPdf, "utf-8");
}

function escapePdfText(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}


// ─── Ownership Transfer Certificate — client-side PDF generator ─────────────
// Runs in the admin dashboard (real browser, so full canvas/image support).
// Mirrors the approved certificate template: bordered layout, serif title,
// client name, project details, cert ID, signature line, and the
// "Crafted By" badge used as an official stamp.
import { jsPDF } from 'jspdf';

const NAVY   = [15, 20, 45];
const ACCENT = [14, 165, 233];
const PURPLE = [147, 51, 234];
const MUTED  = [100, 108, 128];
const CREAM  = [253, 251, 246];

function loadImageAsDataURL(url) {
  return fetch(url)
    .then((res) => res.blob())
    .then((blob) => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    }));
}

export function generateCertificateId(bookingId) {
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `BD-CERT-${bookingId}-${rand}`;
}

export async function buildCertificatePdf({
  clientName, websiteName, websiteUrl, planName, amount, dateStr, certId,
}) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  // Background
  doc.setFillColor(...CREAM);
  doc.rect(0, 0, W, H, 'F');

  // Border (double line)
  const m = 8;
  doc.setDrawColor(...NAVY);
  doc.setLineWidth(0.8);
  doc.rect(m, m, W - 2 * m, H - 2 * m);
  doc.setDrawColor(...ACCENT);
  doc.setLineWidth(0.3);
  doc.rect(m + 3, m + 3, W - 2 * m - 6, H - 2 * m - 6);

  // Wordmark
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  const wmParts = [['Bespoke', ACCENT], ['Deploy', NAVY], ['.', ACCENT], ['in', NAVY]];
  let totalW = 0;
  wmParts.forEach(([t]) => { totalW += doc.getTextWidth(t); });
  let x = W / 2 - totalW / 2;
  const wmY = 22;
  wmParts.forEach(([t, c]) => { doc.setTextColor(...c); doc.text(t, x, wmY); x += doc.getTextWidth(t); });

  // Title
  doc.setFont('times', 'bold');
  doc.setFontSize(30);
  doc.setTextColor(...NAVY);
  doc.text('Certificate of Website Ownership Transfer', W / 2, 40, { align: 'center' });

  // Decorative rule
  const ruleY = 47;
  doc.setDrawColor(...ACCENT);
  doc.setLineWidth(0.5);
  doc.line(W / 2 - 45, ruleY, W / 2 - 6, ruleY);
  doc.line(W / 2 + 6, ruleY, W / 2 + 45, ruleY);
  doc.setFillColor(...PURPLE);
  doc.circle(W / 2, ruleY, 1, 'F');

  // Intro line
  doc.setFont('times', 'italic');
  doc.setFontSize(12);
  doc.setTextColor(...MUTED);
  doc.text('This certifies that full ownership of the website detailed below has been transferred to', W / 2, 56, { align: 'center' });

  // Client name
  doc.setFont('times', 'bolditalic');
  doc.setFontSize(30);
  doc.setTextColor(...NAVY);
  doc.text(clientName, W / 2, 72, { align: 'center' });
  const nameW = doc.getTextWidth(clientName);
  doc.setDrawColor(...ACCENT);
  doc.setLineWidth(0.3);
  doc.line(W / 2 - nameW / 2 - 4, 76, W / 2 + nameW / 2 + 4, 76);

  // Details rows
  const rows = [
    ['WEBSITE NAME', websiteName],
    ['WEBSITE URL', websiteUrl],
    ['PACKAGE', planName],
    ['AMOUNT PAID', `INR ${Number(amount).toLocaleString('en-IN')}`],
    ['DATE OF COMPLETION', dateStr],
  ];
  let ry = 92;
  const col1X = W / 2 - 70, col2X = W / 2 + 4;
  rows.forEach(([label, val]) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...ACCENT);
    doc.text(label, col1X, ry);
    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(...NAVY);
    doc.text(String(val), col2X, ry);
    ry += 10;
  });

  // Certificate ID
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(`Certificate ID: ${certId}`, W / 2, ry + 6, { align: 'center' });

  // Signature block
  const sigY = H - 34;
  doc.setDrawColor(...NAVY);
  doc.setLineWidth(0.3);
  doc.line(28, sigY, 80, sigY);
  doc.setFont('times', 'italic');
  doc.setFontSize(15);
  doc.setTextColor(...NAVY);
  doc.text('Debarun Ghosh', 28, sigY - 3);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text('Founder, BespokeDeploy.in', 28, sigY + 5);

  // Stamp (badge image, rotated slightly for an authentic seal look)
  try {
    const dataUrl = await loadImageAsDataURL('/crafted_by_badge.png');
    const stampSize = 32;
    doc.addImage(dataUrl, 'PNG', W - m - 10 - stampSize, H - m - 8 - stampSize, stampSize, stampSize, undefined, 'FAST', -10);
  } catch (e) {
    console.error('[certificate] stamp image failed to load:', e);
  }

  // Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...MUTED);
  doc.text(
    'This certificate confirms transfer of ownership rights as per the Terms & Conditions agreed at booking  ·  bespokedeploy.in',
    W / 2, H - 10, { align: 'center' }
  );

  return doc;
}

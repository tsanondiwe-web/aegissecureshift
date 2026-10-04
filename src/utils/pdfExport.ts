import { Incident, Invoice, Tenant } from '../types';
import { formatCurrency, getTenantRegion } from './regional';

export function exportIncidentToPDF(incident: Incident) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>INCIDENT REPORT: ${incident.incidentNumber}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #111827; padding: 40px; margin: 0; }
          .header { border-bottom: 3px solid #0f172a; padding-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start; }
          .badge { display: inline-block; padding: 4px 10px; border-radius: 4px; font-weight: 700; font-size: 12px; text-transform: uppercase; }
          .badge-critical { background: #fee2e2; color: #991b1b; border: 1px solid #ef4444; }
          .badge-high { background: #ffedd5; color: #9a3412; border: 1px solid #f97316; }
          .badge-medium { background: #fef9c3; color: #854d0e; border: 1px solid #eab308; }
          .badge-low { background: #f0fdf4; color: #166534; border: 1px solid #22c55e; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 24px 0; }
          .card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 6px; }
          .label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600; margin-bottom: 4px; }
          .value { font-size: 14px; font-weight: 600; color: #0f172a; }
          .desc-box { background: #ffffff; border: 1px solid #cbd5e1; padding: 16px; border-radius: 6px; margin-bottom: 24px; line-height: 1.6; }
          .timeline-item { padding: 10px 0; border-bottom: 1px dashed #e2e8f0; }
          .signature-box { border: 2px solid #0f172a; background: #fafafa; padding: 20px; border-radius: 6px; margin-top: 30px; }
          .watermark { position: fixed; top: 40%; left: 20%; transform: rotate(-30deg); font-size: 80px; color: rgba(239, 68, 68, 0.08); font-weight: 900; pointer-events: none; }
          @media print {
            body { padding: 20px; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="watermark">AEGISOPS SADC OFFICIAL</div>
        <div class="header">
          <div>
            <h1 style="margin: 0; font-size: 24px; color: #0f172a; letter-spacing: -0.5px;">AEGISOPS SECURITY COMMAND</h1>
            <p style="margin: 4px 0 0; color: #64748b; font-size: 13px;">SOUTHERN AFRICA SOC • PSIRA VERIFIED INCIDENT AUDIT</p>
          </div>
          <div style="text-align: right;">
            <div class="badge badge-${incident.severity.toLowerCase()}">${incident.severity} SEVERITY</div>
            <div style="font-size: 12px; color: #64748b; margin-top: 6px;">CAS Docket: <strong>${incident.incidentNumber}</strong></div>
          </div>
        </div>

        <div class="grid">
          <div class="card">
            <div class="label">Incident Category & Title</div>
            <div class="value">${incident.type} — ${incident.title}</div>
            <div class="label" style="margin-top: 12px;">Protected Facility / Site</div>
            <div class="value">${incident.siteName} (${incident.zoneName})</div>
          </div>
          <div class="card">
            <div class="label">Reporting Guard & PSIRA Reg</div>
            <div class="value">${incident.reportedByGuardName}</div>
            <div class="label" style="margin-top: 12px;">Assigned Armed Responder</div>
            <div class="value">${incident.assignedResponderName || 'Unassigned'}</div>
          </div>
        </div>

        <div class="grid">
          <div class="card">
            <div class="label">Timestamp of Occurrence</div>
            <div class="value">${incident.timestamp}</div>
          </div>
          <div class="card">
            <div class="label">SAPS / Metro Police CAD Dispatch</div>
            <div class="value">${incident.policeNotified ? `SAPS Flying Squad Dispatched — CAD #${incident.policeCadNumber || 'PENDING'}` : 'Handled by Aegis Armed Reaction (No SAPS escalation)'}</div>
          </div>
        </div>

        <h3>INCIDENT SUMMARY & FORENSIC NOTES</h3>
        <div class="desc-box">
          ${incident.description}
        </div>

        <h3>AUDIT TIMELINE & CHRONOLOGY</h3>
        <div class="card" style="margin-bottom: 24px;">
          ${incident.timeline
            .map(
              (t) => `
            <div class="timeline-item">
              <span style="font-weight: 700; color: #0284c7;">[${t.timestamp}]</span>
              <strong> ${t.actor}:</strong> ${t.action} — <em>${t.details}</em>
            </div>
          `
            )
            .join('')}
        </div>

        ${
          incident.supervisorSignOff
            ? `
          <div class="signature-box">
            <div class="label">SUPERVISOR DIGITAL SIGN-OFF & CERTIFICATION</div>
            <div style="font-size: 15px; font-weight: 700; color: #0f172a; margin-top: 6px;">Signed by: ${incident.supervisorSignOff.supervisorName}</div>
            <div style="font-size: 13px; color: #64748b; margin-top: 2px;">Timestamp: ${incident.supervisorSignOff.signedAt}</div>
            <div style="margin-top: 10px; font-size: 13px; color: #334155;"><strong>Supervisor Post-Action Directives:</strong> ${incident.supervisorSignOff.notes}</div>
            <div style="margin-top: 14px; padding-top: 8px; border-top: 1px solid #cbd5e1; font-family: monospace; font-size: 11px; color: #475569;">
              DIGITAL SIGNATURE HASH: ${incident.supervisorSignOff.signatureDigital} (SHA-256 ENCRYPTED)
            </div>
          </div>
        `
            : `
          <div style="padding: 16px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; color: #92400e; font-size: 13px;">
            ⚠️ <strong>Pending Supervisor Review:</strong> This incident report has not yet received final executive command sign-off.
          </div>
        `
        }

        <div style="margin-top: 40px; text-align: center;">
          <button onclick="window.print()" style="background: #0284c7; color: #fff; border: none; padding: 12px 24px; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer;">
            Print / Save as PDF
          </button>
        </div>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

export function exportInvoiceToPDF(invoice: Invoice, tenant: Tenant) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  const { currencyCode } = getTenantRegion(tenant);

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>INVOICE ${invoice.invoiceNumber} - AEGISOPS SECURITY</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #111827; padding: 40px; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 30px; }
          th { background: #0f172a; color: #fff; text-align: left; padding: 12px; font-size: 12px; text-transform: uppercase; }
          td { padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
          .totals { margin-top: 30px; margin-left: auto; width: 320px; }
          .tot-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; }
          .tot-final { font-weight: 700; font-size: 18px; border-top: 2px solid #0f172a; padding-top: 10px; margin-top: 10px; color: #0284c7; }
          @media print {
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 style="margin: 0; font-size: 22px; color: #0f172a;">AEGISOPS SECURITY PLATFORM</h1>
            <p style="margin: 4px 0 0; color: #64748b; font-size: 12px;">Southern Africa Managed Security & PSIRA Grade A Armed Response</p>
          </div>
          <div style="text-align: right;">
            <h2 style="margin: 0; color: #0284c7;">TAX INVOICE</h2>
            <div style="font-size: 13px; font-weight: 700;">${invoice.invoiceNumber}</div>
            <div style="font-size: 12px; color: #64748b;">Due Date: ${invoice.dueDate}</div>
          </div>
        </div>

        <div style="margin-top: 24px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
          <div>
            <div style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700;">Billed To (Tenant):</div>
            <div style="font-size: 15px; font-weight: 700; margin-top: 4px;">${invoice.tenantName}</div>
            <div style="font-size: 13px; color: #475569;">Billing Cycle: ${invoice.billingPeriod}</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700;">Payment Status:</div>
            <div style="font-size: 14px; font-weight: 700; color: ${invoice.status === 'Paid' ? '#16a34a' : '#d97706'}; margin-top: 4px;">
              ${invoice.status.toUpperCase()}
            </div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th style="text-align: center;">Qty / Unit</th>
              <th style="text-align: right;">Rate (${currencyCode})</th>
              <th style="text-align: right;">Amount (${currencyCode})</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items
              .map(
                (item) => `
              <tr>
                <td><strong>${item.description}</strong></td>
                <td style="text-align: center;">${item.quantity} ${item.unit}</td>
                <td style="text-align: right;">${formatCurrency(item.rate, tenant)}</td>
                <td style="text-align: right;"><strong>${formatCurrency(item.amount, tenant)}</strong></td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>

        <div class="totals">
          <div class="tot-row"><span>Subtotal:</span> <span>${formatCurrency(invoice.subtotal, tenant)}</span></div>
          <div class="tot-row"><span>Tax:</span> <span>${formatCurrency(invoice.tax, tenant)}</span></div>
          <div class="tot-row tot-final"><span>Total Due (${currencyCode}):</span> <span>${formatCurrency(invoice.total, tenant)}</span></div>
        </div>

        <div style="margin-top: 50px; text-align: center;">
          <button onclick="window.print()" style="background: #0284c7; color: #fff; border: none; padding: 12px 24px; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer;">
            Print / Save Invoice as PDF
          </button>
        </div>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

export function exportIncidentsToCSV(incidents: Incident[]) {
  const headers = ['Incident Number', 'Title', 'Severity', 'Status', 'Site', 'Zone', 'Reported By', 'Assigned Responder', 'Timestamp', 'Police Notified', 'Police CAD'];
  
  const rows = incidents.map(inc => [
    `"${inc.incidentNumber}"`,
    `"${inc.title.replace(/"/g, '""')}"`,
    `"${inc.severity}"`,
    `"${inc.status}"`,
    `"${inc.siteName.replace(/"/g, '""')}"`,
    `"${inc.zoneName.replace(/"/g, '""')}"`,
    `"${inc.reportedByGuardName.replace(/"/g, '""')}"`,
    `"${inc.assignedResponderName || 'None'}"`,
    `"${inc.timestamp}"`,
    `"${inc.policeNotified ? 'Yes' : 'No'}"`,
    `"${inc.policeCadNumber || 'N/A'}"`
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `aegisops_incidents_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

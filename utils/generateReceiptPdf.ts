import { SubscriptionData } from "@/components/features/subscriptions/SubscriptionHistoryTable";

export const generateReceiptPdf = async (record: SubscriptionData) => {
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import("jspdf"),
    import("html2canvas-pro"),
  ]);

  const container = document.createElement("div");
  container.style.width = "595px";
  container.style.height = "842px";
  container.style.background = "#FEFBF3";
  container.style.padding = "20px 20px 56px 20px";
  container.style.display = "flex";
  container.style.flexDirection = "column";
  container.style.gap = "20px";

  // Format amount as currency

  const logoUrl = `${window.location.origin}/assets/images/Optisage Logo.png`;

  container.innerHTML = `
    <div style="width: 100%; display: flex; flex-direction: column; gap: 20px;">
    <div style="width: 100%; background: white;">
      <div style="background: white; padding: 16px; display: flex; flex-direction: column; align-items: center; gap: 12px; border-bottom: 1px solid #E5E5E5; width: 50%; margin: 0 auto;">
        <img src="${logoUrl}" alt="optisage Logo" style="height: 40px;"/>
        <h4 style="font-weight: 600; margin: 0;">Transaction Receipt</h4>
        <h5 style="color: #737373; font-size: 1.5rem; font-weight: 600; margin: 0;">${
          record.status === "active" ? "Successful" : record.status
        }</h5>
        <h6 style="font-size: 2.25rem; font-weight: 700; margin: 0;">${
          record.amount
        }</h6>
      </div>

      <div style="background: white; padding: 16px; display: flex; flex-direction: column; gap: 12px;">
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
          <h6 style="color: #707070; font-size: 0.875rem; margin: 0;">Date and Time</h6>
          <h6 style="font-size: 0.875rem; font-weight: 600; margin: 0;">${
            record.date_text
          }</h6>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
          <h6 style="color: #707070; font-size: 0.875rem; margin: 0;">Payment Method</h6>
          <h6 style="font-size: 0.875rem; font-weight: 600; margin: 0;">${
            record.card.brand
          } ending in ${record.card.last4}</h6>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
          <h6 style="color: #707070; font-size: 0.875rem; margin: 0;">Customers email</h6>
          <h6 style="font-size: 0.875rem; font-weight: 600; margin: 0;">${
            record.email
          }</h6>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
          <h6 style="color: #707070; font-size: 0.875rem; margin: 0;">Package Type</h6>
          <h6 style="font-size: 0.875rem; font-weight: 600; margin: 0;">${
            record.plan
          }</h6>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
          <h6 style="color: #707070; font-size: 0.875rem; margin: 0;">Description</h6>
          <h6 style="font-size: 0.875rem; font-weight: 600; margin: 0; text-align: right; max-width: 60%;">Payment for monthly subscription to ${
            record.plan
          }</h6>
        </div>
      </div>
      </div>

      <div style="color: #5F6362; font-size: 0.75rem; padding: 0 20px; text-align: center; line-height: 1.5;">
        <p>© 2025 optisage delivers real-time insights, historical price trends, and AI-powered recommendations—so you can make data-backed decisions that drive serious revenue.</p>
        <p>15339774 Canada Inc. is registered and regularized by the Canadian Government.</p>
      </div>
    </div>
  `;

  document.body.appendChild(container);

  const canvas = await html2canvas(container, {
    scale: 2,
    useCORS: true,
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF("p", "mm", "a4");
  const imgProps = pdf.getImageProperties(imgData);
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

  pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
  pdf.save(`receipt_${record.transaction_id}.pdf`);
  document.body.removeChild(container);
};

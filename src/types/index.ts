export interface ReportItem {
  productName: string;
  lotCode: string;
  quantity: string;
  condition: string;
}

export interface Report {
  id?: number;
  reportType: string;
  companyReceiving: string;
  reportDate: string;
  receivingMethod: string;
  invoiceNumber: string;
  operatorName: string;
  signature: string;
  items: ReportItem[];
}

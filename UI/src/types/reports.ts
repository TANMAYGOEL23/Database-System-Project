export interface ReportFilter {
  startDate?: string;
  endDate?: string;
  departmentId?: string;
  warehouseId?: string;
  category?: string;
  status?: string;
  searchTerm?: string;
}

export interface InventoryReportSummary {
  totalItems: number;
  totalQuantity: number;
  totalValuation: number;
  lowStockItemsCount: number;
  outOfStockItemsCount: number;
  topValuedCategory: string;
}

export interface ProductionReportSummary {
  totalOrders: number;
  completedOrders: number;
  inProgressOrders: number;
  totalUnitsProduced: number;
  averageEfficiency: number;
  defectRate: number;
}

export interface FinancialReportSummary {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  pendingInvoicesAmount: number;
  pendingPayrollAmount: number;
}

export interface AttendanceReportSummary {
  averageAttendanceRate: number;
  totalPresent: number;
  totalLate: number;
  totalAbsent: number;
  totalWorkHours: number;
}

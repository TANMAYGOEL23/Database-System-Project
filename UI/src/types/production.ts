export type MachineStatus = 'RUNNING' | 'IDLE' | 'MAINTENANCE' | 'ERROR';

export interface Machine {
  machineId: string;
  machineName: string;
  model: string;
  location: string;
  status: MachineStatus;
  efficiency: number; // percentage e.g. 94.2
  temperature: number; // Celsius
  powerUsage: number; // kW
  lastMaintenance: string;
}

export type ProductionOrderStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type ProductionPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface ProductionOrder {
  productionOrderId: string;
  productId: string;
  productName: string;
  machineId: string;
  machineName: string;
  quantity: number;
  producedQuantity: number;
  startDate: string;
  endDate: string;
  status: ProductionOrderStatus;
  priority: ProductionPriority;
  assignedOperatorId?: string;
  assignedOperatorName?: string;
  notes?: string;
}

export interface ProductionLog {
  logId: string;
  productionOrderId: string;
  timestamp: string;
  quantityProduced: number;
  status: 'NORMAL' | 'DEFECTIVE' | 'MAINTENANCE_STOP';
  remarks: string;
  operatorId?: string;
  operatorName?: string;
}

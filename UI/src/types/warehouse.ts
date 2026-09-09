export type RobotStatus = 'IDLE' | 'BUSY' | 'CHARGING' | 'MAINTENANCE' | 'OFFLINE';

export interface Robot {
  robotId: string;
  robotName: string;
  model: string;
  battery: number; // 0 - 100%
  status: RobotStatus;
  currentLocation: string; // e.g. "Zone A - Shelf S04"
  payloadCapacityKg: number;
  totalTasksCompleted: number;
  lastActive?: string;
}

export type RobotTaskStatus = 'CREATED' | 'ASSIGNED' | 'IN_PROGRESS' | 'PICKED' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED';

export interface RobotTask {
  taskId: string;
  robotId: string;
  robotName?: string;
  shelfId: string;
  shelfLocation?: string;
  productId: string;
  productName?: string;
  quantity: number;
  targetLocation: string; // e.g. "Dispatch Bay 2"
  startTime?: string;
  endTime?: string;
  status: RobotTaskStatus;
  assignedEmployeeId?: string;
  assignedEmployeeName?: string;
  priority?: 'NORMAL' | 'HIGH' | 'URGENT';
}

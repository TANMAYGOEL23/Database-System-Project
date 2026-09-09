import { apiClient, simulateLatency } from './api';
import { Robot, RobotTask, RobotTaskStatus } from '../types/warehouse';
import { StockTransaction } from '../types/inventory';
import { mockDb } from './mockStorage';

const LIFECYCLE_STEPS: RobotTaskStatus[] = [
  'CREATED',
  'ASSIGNED',
  'IN_PROGRESS',
  'PICKED',
  'DELIVERED',
  'COMPLETED',
];

export const robotService = {
  async getRobots(): Promise<Robot[]> {
    try {
      const response = await apiClient.get<Robot[]>('/robots');
      return response.data;
    } catch {
      await simulateLatency(150);
      return mockDb.getRobots();
    }
  },

  async updateRobotStatus(id: string, status: Robot['status'], battery?: number): Promise<Robot> {
    try {
      const response = await apiClient.patch<Robot>(`/robots/${id}/status`, { status, battery });
      return response.data;
    } catch {
      await simulateLatency(150);
      const robots = mockDb.getRobots();
      const idx = robots.findIndex((r) => r.robotId === id);
      if (idx === -1) throw new Error(`Robot ${id} not found`);
      robots[idx].status = status;
      if (battery !== undefined) robots[idx].battery = battery;
      robots[idx].lastActive = new Date().toISOString().replace('T', ' ').substring(0, 19);
      mockDb.setRobots(robots);
      return robots[idx];
    }
  },

  async getTasks(): Promise<RobotTask[]> {
    try {
      const response = await apiClient.get<RobotTask[]>('/robots/tasks');
      return response.data;
    } catch {
      await simulateLatency(150);
      return mockDb.getRobotTasks();
    }
  },

  async createTask(task: Omit<RobotTask, 'taskId' | 'status' | 'startTime'>): Promise<RobotTask> {
    try {
      const response = await apiClient.post<RobotTask>('/robots/tasks', task);
      return response.data;
    } catch {
      await simulateLatency(250);
      const tasks = mockDb.getRobotTasks();
      const robots = mockDb.getRobots();
      const newId = `TSK-ROB-${String(tasks.length + 101)}`;
      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

      const rob = robots.find((r) => r.robotId === task.robotId);

      const newTask: RobotTask = {
        ...task,
        taskId: newId,
        robotName: rob ? rob.robotName : task.robotId,
        status: 'ASSIGNED',
        startTime: nowStr,
      };

      if (rob) {
        rob.status = 'BUSY';
        mockDb.setRobots(robots);
      }

      mockDb.setRobotTasks([newTask, ...tasks]);
      return newTask;
    }
  },

  async advanceTaskStatus(taskId: string): Promise<RobotTask> {
    try {
      const response = await apiClient.post<RobotTask>(`/robots/tasks/${taskId}/advance`);
      return response.data;
    } catch {
      await simulateLatency(200);
      const tasks = mockDb.getRobotTasks();
      const robots = mockDb.getRobots();
      const idx = tasks.findIndex((t) => t.taskId === taskId);
      if (idx === -1) throw new Error(`Task ${taskId} not found`);

      const current = tasks[idx];
      const stepIdx = LIFECYCLE_STEPS.indexOf(current.status);
      if (stepIdx === -1 || stepIdx >= LIFECYCLE_STEPS.length - 1) {
        return current;
      }

      const nextStatus = LIFECYCLE_STEPS[stepIdx + 1];
      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

      tasks[idx] = {
        ...current,
        status: nextStatus,
        endTime: nextStatus === 'COMPLETED' ? nowStr : current.endTime,
      };

      if (nextStatus === 'COMPLETED') {
        const rob = robots.find((r) => r.robotId === current.robotId);
        if (rob) {
          rob.status = 'IDLE';
          rob.totalTasksCompleted += 1;
          rob.currentLocation = current.targetLocation;
          mockDb.setRobots(robots);
        }

        // Add a stock movement transaction
        const txns = mockDb.getStockTransactions();
        const newTxn: StockTransaction = {
          transactionId: `TXN-${Date.now().toString().slice(-4)}`,
          productId: current.productId,
          productName: current.productName || 'Moved Item',
          warehouseId: 'WAR001',
          warehouseName: 'Main Plant Facility',
          transactionType: 'ROBOT_MOVEMENT',
          quantity: current.quantity,
          date: nowStr,
          reference: current.taskId,
          notes: `Delivered by ${current.robotName || current.robotId} to ${current.targetLocation}`,
        };
        txns.unshift(newTxn);
        mockDb.setStockTransactions(txns);
      }

      mockDb.setRobotTasks(tasks);
      return tasks[idx];
    }
  },
};

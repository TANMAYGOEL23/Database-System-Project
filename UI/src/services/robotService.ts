import { delay } from './api';
import { supabase, isSupabaseConfigured } from './supabase';
import { mockStorage } from './mockStorage';
import { Robot, RobotTask, RobotStatus, RobotTaskStatus } from '../types/warehouse';

function mapRobotFromDb(row: any): Robot {
  return {
    robotId: row.robot_id || row.robotId,
    robotName: row.robot_name || row.robotName,
    model: row.model,
    battery: parseInt(row.battery || 100, 10),
    status: row.status,
    currentLocation: row.current_location || row.currentLocation,
    payloadCapacityKg: parseInt(row.payload_capacity_kg || row.payloadCapacityKg || 1000, 10),
    totalTasksCompleted: parseInt(row.total_tasks_completed || row.totalTasksCompleted || 0, 10),
  };
}

function mapTaskFromDb(row: any): RobotTask {
  return {
    taskId: row.task_id || row.taskId,
    robotId: row.robot_id || row.robotId,
    robotName: row.robot_name || row.robotName,
    shelfId: row.shelf_id || row.shelfId,
    shelfLocation: row.shelf_location || row.shelfLocation,
    productId: row.product_id || row.productId,
    productName: row.product_name || row.productName,
    quantity: parseInt(row.quantity || 1, 10),
    targetLocation: row.target_location || row.targetLocation,
    startTime: row.start_time || row.startTime,
    endTime: row.end_time || row.endTime,
    status: row.status,
    priority: row.priority,
  };
}

export const robotService = {
  async getRobots(): Promise<Robot[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('robots').select('*').order('robot_id');
      if (error) throw new Error(error.message);
      return (data || []).map(mapRobotFromDb);
    }

    await delay(200);
    return mockStorage.robots;
  },

  async updateRobotStatus(robotId: string, status: RobotStatus, battery?: number): Promise<Robot> {
    if (isSupabaseConfigured()) {
      const payload: any = { status };
      if (battery !== undefined) payload.battery = battery;
      const { data, error } = await supabase.from('robots').update(payload).eq('robot_id', robotId).select().single();
      if (error) throw new Error(error.message);
      return mapRobotFromDb(data);
    }

    await delay(250);
    const robots = mockStorage.robots;
    const idx = robots.findIndex((r) => r.robotId === robotId);
    if (idx === -1) throw new Error(`Robot ${robotId} not found`);

    robots[idx].status = status;
    if (battery !== undefined) robots[idx].battery = battery;
    mockStorage.robots = robots;
    return robots[idx];
  },

  async getTasks(): Promise<RobotTask[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('robot_tasks').select('*').order('start_time', { ascending: false });
      if (error) throw new Error(error.message);
      return (data || []).map(mapTaskFromDb);
    }

    await delay(200);
    return mockStorage.robotTasks;
  },

  async createTask(task: Omit<RobotTask, 'taskId' | 'startTime' | 'status'>): Promise<RobotTask> {
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

    if (isSupabaseConfigured()) {
      const payload = {
        robot_id: task.robotId,
        robot_name: task.robotName,
        shelf_id: task.shelfId,
        shelf_location: task.shelfLocation,
        product_id: task.productId,
        product_name: task.productName,
        quantity: task.quantity,
        target_location: task.targetLocation,
        start_time: nowStr,
        status: 'ASSIGNED',
        priority: task.priority || 'HIGH',
      };

      const { data, error } = await supabase.from('robot_tasks').insert([payload]).select().single();
      if (error) throw new Error(error.message);

      await supabase.from('robots').update({ status: 'BUSY' }).eq('robot_id', task.robotId);
      return mapTaskFromDb(data);
    }

    await delay(300);
    const newTask: RobotTask = {
      ...task,
      taskId: `TSK-ROBOT-${Math.floor(100 + Math.random() * 900)}`,
      startTime: nowStr,
      status: 'ASSIGNED',
    };
    mockStorage.robotTasks = [newTask, ...mockStorage.robotTasks];

    const robots = mockStorage.robots;
    const rIdx = robots.findIndex((r) => r.robotId === task.robotId);
    if (rIdx !== -1) {
      robots[rIdx].status = 'BUSY';
      mockStorage.robots = robots;
    }

    return newTask;
  },

  async advanceTaskStatus(taskId: string): Promise<RobotTask> {
    const statusOrder: RobotTaskStatus[] = ['CREATED', 'ASSIGNED', 'IN_PROGRESS', 'PICKED', 'DELIVERED', 'COMPLETED'];

    if (isSupabaseConfigured()) {
      const { data: t } = await supabase.from('robot_tasks').select('*').eq('task_id', taskId).single();
      if (!t) throw new Error(`Task ${taskId} not found`);

      const currentIdx = statusOrder.indexOf(t.status as RobotTaskStatus);
      const nextStatus = currentIdx < statusOrder.length - 1 ? statusOrder[currentIdx + 1] : 'COMPLETED';
      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

      const updatePayload: any = { status: nextStatus };
      if (nextStatus === 'COMPLETED') updatePayload.end_time = nowStr;

      const { data: updated, error } = await supabase.from('robot_tasks').update(updatePayload).eq('task_id', taskId).select().single();
      if (error) throw new Error(error.message);

      if (nextStatus === 'COMPLETED' && t.robot_id) {
        const { data: rob } = await supabase.from('robots').select('*').eq('robot_id', t.robot_id).single();
        if (rob) {
          await supabase.from('robots').update({
            status: 'IDLE',
            total_tasks_completed: (rob.total_tasks_completed || 0) + 1,
            current_location: t.target_location,
          }).eq('robot_id', t.robot_id);
        }

        await supabase.from('stock_transactions').insert([
          {
            product_id: t.product_id,
            product_name: t.product_name,
            warehouse_id: 'WH01',
            warehouse_name: 'Central Raw Materials Hub',
            transaction_type: 'ROBOT_MOVEMENT',
            quantity: t.quantity,
            date: nowStr,
            reference: t.task_id,
            notes: `AMR transfer to ${t.target_location}`,
          },
        ]);
      }

      return mapTaskFromDb(updated);
    }

    await delay(300);
    const tasks = mockStorage.robotTasks;
    const idx = tasks.findIndex((t) => t.taskId === taskId);
    if (idx === -1) throw new Error(`Task ${taskId} not found`);

    const currentIdx = statusOrder.indexOf(tasks[idx].status);
    const nextStatus = currentIdx < statusOrder.length - 1 ? statusOrder[currentIdx + 1] : 'COMPLETED';
    tasks[idx].status = nextStatus;

    if (nextStatus === 'COMPLETED') {
      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
      tasks[idx].endTime = nowStr;

      const robots = mockStorage.robots;
      const rIdx = robots.findIndex((r) => r.robotId === tasks[idx].robotId);
      if (rIdx !== -1) {
        robots[rIdx].status = 'IDLE';
        robots[rIdx].totalTasksCompleted += 1;
        robots[rIdx].currentLocation = tasks[idx].targetLocation;
        mockStorage.robots = robots;
      }

      const newTxn = {
        transactionId: `TXN-${Math.floor(1000 + Math.random() * 9000)}`,
        productId: tasks[idx].productId,
        productName: tasks[idx].productName || tasks[idx].productId,
        warehouseId: 'WH01',
        warehouseName: 'Central Raw Materials Hub',
        transactionType: 'ROBOT_MOVEMENT' as const,
        quantity: tasks[idx].quantity,
        date: nowStr,
        reference: tasks[idx].taskId,
        notes: `AMR transfer to ${tasks[idx].targetLocation}`,
      };
      mockStorage.stockTransactions = [newTxn, ...mockStorage.stockTransactions];
    }

    mockStorage.robotTasks = tasks;
    return tasks[idx];
  },
};

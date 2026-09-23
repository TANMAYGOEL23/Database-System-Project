import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { Input } from '../ui/Input';
import { useNotification } from '../../context/NotificationContext';
import { robotService } from '../../services/robotService';
import { productService } from '../../services/productService';
import { warehouseService } from '../../services/warehouseService';
import { Robot } from '../../types/warehouse';
import { Product, Shelf } from '../../types/inventory';
import { Bot, Play, Route, CheckCircle2 } from 'lucide-react';

export interface SimulateRobotTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const SimulateRobotTaskModal: React.FC<SimulateRobotTaskModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [robots, setRobots] = useState<Robot[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [shelves, setShelves] = useState<Shelf[]>([]);

  const [selectedRobotId, setSelectedRobotId] = useState('');
  const [selectedShelfId, setSelectedShelfId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('10');
  const [targetLocation, setTargetLocation] = useState('CNC Machining Bay Alpha');
  const [isLoading, setIsLoading] = useState(false);

  const { showToast } = useNotification();

  useEffect(() => {
    if (isOpen) {
      const load = async () => {
        const [robList, prodList, shelfList] = await Promise.all([
          robotService.getRobots(),
          productService.getAll(),
          warehouseService.getAllShelves(),
        ]);
        setRobots(robList);
        setProducts(prodList);
        setShelves(shelfList);

        if (robList.length > 0) setSelectedRobotId(robList[0].robotId);
        if (prodList.length > 0) setSelectedProductId(prodList[0].productId);
        if (shelfList.length > 0) setSelectedShelfId(shelfList[0].shelfId);
      };
      load();
    }
  }, [isOpen]);

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRobotId || !selectedShelfId || !selectedProductId) return;

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      showToast('error', 'Invalid Quantity', 'Please enter a positive quantity');
      return;
    }

    const rob = robots.find((r) => r.robotId === selectedRobotId);
    const prod = products.find((p) => p.productId === selectedProductId);
    const shelf = shelves.find((s) => s.shelfId === selectedShelfId);

    try {
      setIsLoading(true);
      const task = await robotService.createTask({
        robotId: selectedRobotId,
        robotName: rob ? rob.robotName : selectedRobotId,
        shelfId: selectedShelfId,
        shelfLocation: shelf ? `${shelf.warehouseName} (Row ${shelf.row}, Col ${shelf.column})` : selectedShelfId,
        productId: selectedProductId,
        productName: prod ? prod.productName : selectedProductId,
        quantity: qty,
        targetLocation,
        priority: 'HIGH',
      });

      showToast(
        'success',
        'AMR Mission Dispatched',
        `Task ${task.taskId} assigned to ${task.robotName}: Transport ${qty}x ${task.productName} to ${targetLocation}.`
      );

      onSuccess?.();
      onClose();
    } catch (err: any) {
      showToast('error', 'Dispatch Failed', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedRob = robots.find((r) => r.robotId === selectedRobotId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Dispatch Autonomous Guided Vehicle (AGV/AMR) Mission"
      subtitle="Autonomous Warehouse Material Transfer Mission Dispatcher"
      maxWidth="lg"
      icon={<Bot className="w-5 h-5 text-indigo-400" />}
    >
      <form onSubmit={handleSimulate} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Assigned AGV / AMR Unit"
            value={selectedRobotId}
            onChange={(e) => setSelectedRobotId(e.target.value)}
            options={robots.map((r) => ({
              label: `${r.robotName} (${r.status} - Battery: ${r.battery}%)`,
              value: r.robotId,
            }))}
            required
          />

          <Select
            label="Source Pick Shelf / Bay"
            value={selectedShelfId}
            onChange={(e) => setSelectedShelfId(e.target.value)}
            options={shelves.map((s) => ({
              label: `${s.shelfId} - ${s.warehouseName} (Row ${s.row})`,
              value: s.shelfId,
            }))}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Material / Component Payload"
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            options={products.map((p) => ({
              label: `${p.productName} (${p.category})`,
              value: p.productId,
            }))}
            required
          />

          <Input
            label="Transfer Batch Quantity"
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
          />
        </div>

        <Input
          label="Delivery Target Waypoint / Cell"
          value={targetLocation}
          onChange={(e) => setTargetLocation(e.target.value)}
          placeholder="e.g. CNC Machining Bay Alpha"
          leftIcon={<Route className="w-4 h-4" />}
          required
        />

        {selectedRob && (
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-1 font-mono text-slate-400">
            <div className="flex justify-between">
              <span>AGV Hardware Model:</span>
              <span className="text-slate-200">{selectedRob.model}</span>
            </div>
            <div className="flex justify-between">
              <span>Payload Limit:</span>
              <span className="text-slate-200">{selectedRob.payloadCapacityKg} kg</span>
            </div>
            <div className="flex justify-between">
              <span>Battery Charge:</span>
              <span className={selectedRob.battery > 50 ? 'text-emerald-400' : 'text-amber-400'}>
                {selectedRob.battery}%
              </span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <Button variant="secondary" onClick={onClose} type="button" disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            isLoading={isLoading}
            leftIcon={<Play className="w-4 h-4" />}
          >
            Dispatch AMR Mission
          </Button>
        </div>
      </form>
    </Modal>
  );
};

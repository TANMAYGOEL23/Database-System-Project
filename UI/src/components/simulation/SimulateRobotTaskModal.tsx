import React, { useState, useEffect } from 'react';
import { Bot, Navigation, CheckCircle2, ArrowRight } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { Input } from '../ui/Input';
import { robotService } from '../../services/robotService';
import { productService } from '../../services/productService';
import { warehouseService } from '../../services/warehouseService';
import { useNotification } from '../../context/NotificationContext';
import { Robot } from '../../types/warehouse';
import { Product, Shelf } from '../../types/inventory';

interface SimulateRobotTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
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
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedShelfId, setSelectedShelfId] = useState('');
  const [quantity, setQuantity] = useState('10');
  const [targetLocation, setTargetLocation] = useState('Hangar 1 - Station A1');
  const [isLoading, setIsLoading] = useState(false);

  const { showToast } = useNotification();

  useEffect(() => {
    if (isOpen) {
      const load = async () => {
        const r = await robotService.getRobots();
        const p = await productService.getAll();
        const s = await warehouseService.getShelves();
        setRobots(r);
        setProducts(p);
        setShelves(s);
        if (r.length > 0) setSelectedRobotId(r[0].robotId);
        if (p.length > 0) setSelectedProductId(p[0].productId);
        if (s.length > 0) setSelectedShelfId(s[0].shelfId);
      };
      load();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRobotId || !selectedProductId || !selectedShelfId) return;

    const prd = products.find((p) => p.productId === selectedProductId);
    const shf = shelves.find((s) => s.shelfId === selectedShelfId);
    const rob = robots.find((r) => r.robotId === selectedRobotId);

    try {
      setIsLoading(true);
      const newTask = await robotService.createTask({
        robotId: selectedRobotId,
        shelfId: selectedShelfId,
        shelfLocation: shf ? `${shf.warehouseName} [Row ${shf.row} Col ${shf.column}]` : selectedShelfId,
        productId: selectedProductId,
        productName: prd ? prd.productName : selectedProductId,
        quantity: parseInt(quantity, 10) || 1,
        targetLocation,
        priority: 'HIGH',
      });

      showToast(
        'success',
        'Robot AGV Mission Dispatched',
        `Mission ${newTask.taskId} assigned to ${rob ? rob.robotName : selectedRobotId} to pick ${quantity}x ${prd?.productName}`
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast('error', 'Mission Dispatch Error', err.message || 'Failed to dispatch robot task');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Dispatch Simulated AMR/AGV Mission"
      subtitle="Autonomous guided vehicle warehouse material transfer simulation"
      icon={<Bot className="w-5 h-5 text-indigo-400" />}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 bg-indigo-950/40 border border-indigo-800/40 rounded-lg text-xs text-indigo-300 flex items-start gap-2">
          <Navigation className="w-4 h-4 mt-0.5 flex-shrink-0 text-indigo-400" />
          <span>
            <strong>Autonomous Task Lifecycle:</strong> Dispatched tasks initiate software-stepped movement: 
            <code>CREATED → ASSIGNED → IN_PROGRESS → PICKED → DELIVERED → COMPLETED</code>.
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Assigned Robot AGV/AMR"
            value={selectedRobotId}
            onChange={(e) => setSelectedRobotId(e.target.value)}
            options={robots.map((r) => ({
              value: r.robotId,
              label: `${r.robotName} (${r.status} - 🔋${r.battery}%)`,
            }))}
            required
          />

          <Select
            label="Source Shelf (Simulated RFID)"
            value={selectedShelfId}
            onChange={(e) => setSelectedShelfId(e.target.value)}
            options={shelves.map((s) => ({
              value: s.shelfId,
              label: `${s.shelfId} - ${s.warehouseName} [Row ${s.row}, Col ${s.column}] (${s.rfidTag})`,
            }))}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Payload Material"
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            options={products.map((p) => ({
              value: p.productId,
              label: `${p.productId} - ${p.productName}`,
            }))}
            required
          />

          <Input
            label="Transfer Quantity"
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
          />
        </div>

        <Input
          label="Destination Drop-off Zone"
          value={targetLocation}
          onChange={(e) => setTargetLocation(e.target.value)}
          placeholder="e.g. Hangar 1 CNC Station A1 or Dispatch Bay 2"
          required
        />

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" type="submit" isLoading={isLoading} leftIcon={<Bot className="w-4 h-4" />}>
            Dispatch Autonomous Task
          </Button>
        </div>
      </form>
    </Modal>
  );
};

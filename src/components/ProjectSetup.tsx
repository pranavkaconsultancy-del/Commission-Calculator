import React from 'react';
import { Building2, IndianRupee } from 'lucide-react';
import { formatCurrency } from '../utils';

interface ProjectSetupProps {
  name: string;
  totalSaleValue: number;
  onNameChange: (name: string) => void;
  onValueChange: (value: number) => void;
}

export default function ProjectSetup({
  name,
  totalSaleValue,
  onNameChange,
  onValueChange,
}: ProjectSetupProps) {
  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/[^0-9.]/g, '');
    const numVal = parseFloat(rawVal);
    onValueChange(isNaN(numVal) ? 0 : numVal);
  };

  return (
    <div id="project-setup-card" className="bg-white rounded-xl shadow-xs border border-gray-100 p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
          <Building2 className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-semibold text-gray-900 text-lg">Project Identification</h2>
          <p className="text-xs text-gray-500">Configure core project parameters and property sales figures</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Project Name Input */}
        <div className="space-y-1.5">
          <label id="project-name-label" htmlFor="project-name-input" className="block text-xs font-semibold text-gray-600">
            PROJECT NAME
          </label>
          <div className="relative">
            <input
              id="project-name-input"
              type="text"
              placeholder="e.g. Oakridge Heights Phase II"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50 text-gray-800 placeholder-gray-400 font-medium"
            />
          </div>
          <span className="text-[10px] text-gray-400 block">Unique identifier for audit report</span>
        </div>

        {/* Total Sale Value Input */}
        <div className="space-y-1.5">
          <label id="total-sale-value-label" htmlFor="total-sale-value-input" className="block text-xs font-semibold text-gray-600">
            TOTAL SALE VALUE (INR)
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none">
              <IndianRupee className="w-4 h-4" />
            </span>
            <input
              id="total-sale-value-input"
              type="text"
              placeholder="0.00"
              value={totalSaleValue === 0 ? '' : totalSaleValue}
              onChange={handleValueChange}
              className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50 text-gray-800 font-medium"
            />
          </div>
          <div className="flex justify-between items-center text-[10px]">
            <span className="text-gray-400">Total transaction amount</span>
            <span className="text-blue-600 font-semibold">{formatCurrency(totalSaleValue)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

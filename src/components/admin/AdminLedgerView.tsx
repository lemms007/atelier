import React from 'react';
import { useApp } from '../../context/AppContext';
import { formatPHP, formatFullName } from '../../utils/formatters';
import { Landmark, ShieldCheck, CheckCircle2, ArrowUpRight, DollarSign, Wallet } from 'lucide-react';

export const AdminLedgerView: React.FC = () => {
  const { orders, updateOrderStatus } = useApp();

  // Financial calculations
  const totalRentalRevenue = orders.reduce((acc, o) => acc + o.subtotalRental, 0);
  const totalDepositsHeld = orders
    .filter((o) => !['Completed / Deposit Refunded', 'Payment Rejected'].includes(o.status))
    .reduce((acc, o) => acc + o.totalDeposit, 0);
  const totalDepositsRefunded = orders
    .filter((o) => o.status === 'Completed / Deposit Refunded')
    .reduce((acc, o) => acc + o.totalDeposit, 0);
  const totalShippingCollected = orders.reduce((acc, o) => acc + o.shippingFee, 0);
  const grandGrossTurnover = orders
    .filter((o) => o.status !== 'Payment Rejected')
    .reduce((acc, o) => acc + o.grandTotal, 0);

  const gcashOrders = orders.filter((o) => o.payment.method === 'gcash');
  const bankOrders = orders.filter((o) => o.payment.method === 'bank_transfer');

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-[#E8E4DF]">
          <span className="text-[10px] text-[#948E88] uppercase font-medium tracking-wider block">
            Escrow Deposits Held
          </span>
          <span className="font-serif text-xl font-semibold text-[#141312] mt-0.5 block">
            {formatPHP(totalDepositsHeld)}
          </span>
          <span className="text-[10px] text-[#D97706] mt-1 block">Held until garment return</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E8E4DF]">
          <span className="text-[10px] text-[#948E88] uppercase font-medium tracking-wider block">
            Rental Gross Revenue
          </span>
          <span className="font-serif text-xl font-semibold text-[#141312] mt-0.5 block">
            {formatPHP(totalRentalRevenue)}
          </span>
          <span className="text-[10px] text-[#16A34A] mt-1 block">Net Rental Fees</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E8E4DF]">
          <span className="text-[10px] text-[#948E88] uppercase font-medium tracking-wider block">
            Refunded to Renters
          </span>
          <span className="font-serif text-xl font-semibold text-[#141312] mt-0.5 block">
            {formatPHP(totalDepositsRefunded)}
          </span>
          <span className="text-[10px] text-[#5C5854] mt-1 block">Pristine garment release</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E8E4DF]">
          <span className="text-[10px] text-[#948E88] uppercase font-medium tracking-wider block">
            Gross Escrow Turnover
          </span>
          <span className="font-serif text-xl font-semibold text-[#141312] mt-0.5 block">
            {formatPHP(grandGrossTurnover)}
          </span>
          <span className="text-[10px] text-[#5C5854] mt-1 block">Total payment gateway volume</span>
        </div>
      </div>

      {/* Payment Gateway Split */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl border border-[#E8E4DF] space-y-3">
          <div className="flex items-center justify-between border-b border-[#E8E4DF] pb-2">
            <h3 className="font-serif text-xs font-semibold text-[#141312] flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-[#007DFE]" />
              <span>GCash QR & In-App Collections</span>
            </h3>
            <span className="text-[10px] text-[#5C5854] font-medium">{gcashOrders.length} Transactions</span>
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-[#5C5854]">
              <span>GCash Volume:</span>
              <span className="font-semibold text-[#141312]">
                {formatPHP(gcashOrders.reduce((acc, o) => acc + o.grandTotal, 0))}
              </span>
            </div>
            <div className="flex justify-between text-[11px] text-[#948E88]">
              <span>Merchant Destination:</span>
              <span className="font-mono">0917-889-4412 (Sinta Wardrobe Rental)</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E8E4DF] space-y-3">
          <div className="flex items-center justify-between border-b border-[#E8E4DF] pb-2">
            <h3 className="font-serif text-xs font-semibold text-[#141312] flex items-center gap-1.5">
              <Landmark className="w-3.5 h-3.5 text-[#141312]" />
              <span>Direct Bank Wire Collections</span>
            </h3>
            <span className="text-[10px] text-[#5C5854] font-medium">{bankOrders.length} Transactions</span>
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-[#5C5854]">
              <span>Bank Wire Volume:</span>
              <span className="font-semibold text-[#141312]">
                {formatPHP(bankOrders.reduce((acc, o) => acc + o.grandTotal, 0))}
              </span>
            </div>
            <div className="flex justify-between text-[11px] text-[#948E88]">
              <span>Accounts:</span>
              <span>BPI / BDO / UnionBank Corporate</span>
            </div>
          </div>
        </div>
      </div>

      {/* Escrow Release Ledger Table */}
      <div className="bg-white rounded-xl border border-[#E8E4DF] overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[#E8E4DF] flex items-center justify-between">
          <div>
            <h3 className="font-serif text-xs font-semibold text-[#141312]">
              Escrow Deposits & Order Settlement Ledger
            </h3>
            <p className="text-[11px] text-[#5C5854] mt-0.5">
              Active security deposit escrow tracking and refund release verification
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#141312]">
            <thead className="bg-[#FAF9F6] text-[10px] uppercase tracking-wider text-[#948E88] font-medium border-b border-[#E8E4DF]">
              <tr>
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-3">Renter & Contact</th>
                <th className="py-3 px-3">Rental Fee</th>
                <th className="py-3 px-3">Deposit Held</th>
                <th className="py-3 px-3">Method & Ref</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Escrow Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E4DF]">
              {orders.map((order) => {
                const isCompleted = order.status === 'Completed / Deposit Refunded';
                const isReturnInTransit = order.status === 'Return in Transit';

                return (
                  <tr key={order.id} className="hover:bg-[#FAF9F6]/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-xs text-[#141312]">
                      {order.id}
                    </td>

                    <td className="py-3 px-3">
                      <p className="font-medium text-[#141312]">
                        {formatFullName(order.shipping.firstName, order.shipping.middleName, order.shipping.lastName) || order.shipping.fullName}
                      </p>
                      <p className="text-[10px] text-[#948E88]">{order.shipping.mobileNumber}</p>
                    </td>

                    <td className="py-3 px-3 font-medium text-[#141312]">
                      {formatPHP(order.subtotalRental)}
                    </td>

                    <td className="py-3 px-3 font-medium text-[#141312]">
                      {formatPHP(order.totalDeposit)}
                    </td>

                    <td className="py-3 px-3">
                      <span className="uppercase font-medium text-[10px] text-[#5C5854]">
                        {order.payment.method}
                      </span>
                      <p className="text-[9px] font-mono text-[#948E88] truncate max-w-[100px]">
                        {order.payment.referenceNumber}
                      </p>
                    </td>

                    <td className="py-3 px-3">
                      <span className="text-[10px] bg-[#FAF9F6] border border-[#E8E4DF] px-2 py-0.5 rounded font-medium text-[#5C5854]">
                        {order.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      {isCompleted ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-[#16A34A] font-medium">
                          <CheckCircle2 className="w-3 h-3" />
                          Refund Released
                        </span>
                      ) : isReturnInTransit ? (
                        <button
                          onClick={() =>
                            updateOrderStatus(
                              order.id,
                              'Completed / Deposit Refunded',
                              'Textile inspection passed. Refund remitted via GCash/Bank.'
                            )
                          }
                          className="px-2 py-1 bg-[#141312] hover:bg-[#2A2725] text-white text-[10px] font-medium rounded transition-colors"
                        >
                          Verify & Release Deposit
                        </button>
                      ) : (
                        <span className="text-[10px] text-[#948E88]">
                          Escrow Held In Trust
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

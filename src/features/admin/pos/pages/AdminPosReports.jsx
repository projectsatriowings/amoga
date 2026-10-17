import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  BarChart3,
  Calendar,
  Filter,
  Receipt,
  Download,
  DollarSign,
  Boxes,
  PieChart,
  Tag,
  ShieldCheck,
  RotateCcw,
  RefreshCw,
  MapPin,
  Banknote,
  Smartphone,
  CreditCard,
  Layers,
} from 'lucide-react';
import { posApi } from '../services/posApiClient';

export function AdminPosReports() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [stallEventId, setStallEventId] = useState('all');
  const [paymentMethod, setPaymentMethod] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [events, setEvents] = useState([]);

  useEffect(() => {
    async function loadEvents() {
      try {
        const res = await posApi.listEvents();
        if (res?.events) setEvents(res.events);
      } catch (err) {
        console.error('Failed to load events:', err);
      }
    }
    loadEvents();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await posApi.getReports({
        stallEventId,
        paymentMethod,
        startDate: startDate || null,
        endDate: endDate || null,
      });

      if (res?.report) {
        setReport(res.report);
      }
    } catch (err) {
      console.error('Failed to load POS sales reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [stallEventId, paymentMethod, startDate, endDate]);

  const summary = report?.summary || {
    totalBills: 0,
    grossSales: 0,
    totalDiscounts: 0,
    totalTax: 0,
    netSales: 0,
    totalRefunds: 0,
    totalUnitsSold: 0,
    averageBillValue: 0,
  };

  const paymentBreakdown = report?.paymentBreakdown || {};
  const collectionBreakdown = report?.collectionBreakdown || {};
  const eventSales = report?.eventSales || [];

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#762F39] to-[#5C232B] flex items-center justify-center text-white shadow-md">
            <TrendingUp className="w-6 h-6 text-amber-200" />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold text-stone-900 tracking-tight">
              POS Sales & Financial Analytics
            </h1>
            <p className="text-xs text-stone-500 font-sans mt-0.5">
              Statutory database aggregations across physical stalls, exhibitions, GST decomposition, and collections.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchReports}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-700 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <label className="block text-[10px] font-semibold text-stone-500 uppercase mb-1">
            Stall / Event
          </label>
          <select
            value={stallEventId}
            onChange={(e) => setStallEventId(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs bg-stone-50 border border-stone-300 rounded-xl focus:outline-none"
          >
            <option value="all">All Stalls & Events</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-semibold text-stone-500 uppercase mb-1">
            Payment Method
          </label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs bg-stone-50 border border-stone-300 rounded-xl focus:outline-none"
          >
            <option value="all">All Payment Methods</option>
            <option value="CASH">Cash</option>
            <option value="UPI">UPI</option>
            <option value="CARD">Card</option>
            <option value="OTHER">Split / Other</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-semibold text-stone-500 uppercase mb-1">
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs bg-stone-50 border border-stone-300 rounded-xl font-mono focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-[10px] font-semibold text-stone-500 uppercase mb-1">
            End Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs bg-stone-50 border border-stone-300 rounded-xl font-mono focus:outline-none"
          />
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Net Sales */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-500 text-xs font-semibold">
            <span>Net POS Sales</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="font-mono text-2xl font-bold text-stone-900">
              ₹{summary.netSales.toLocaleString('en-IN')}
            </span>
            <span className="text-[11px] text-stone-500 block mt-0.5">
              Gross: ₹{summary.grossSales.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Total Bills & Average Value */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-500 text-xs font-semibold">
            <span>Bills & Average</span>
            <div className="w-8 h-8 rounded-xl bg-[#762F39]/10 text-[#762F39] flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="font-mono text-2xl font-bold text-stone-900">
              {summary.totalBills} Bills
            </span>
            <span className="text-[11px] text-stone-500 block mt-0.5">
              Avg Bill: ₹{summary.averageBillValue.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* GST Collected */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-500 text-xs font-semibold">
            <span>Statutory GST Included</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-[#8C6320] flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="font-mono text-2xl font-bold text-[#8C6320]">
              ₹{summary.totalTax.toLocaleString('en-IN')}
            </span>
            <span className="text-[11px] text-stone-500 block mt-0.5">
              Intra & Inter-State GST
            </span>
          </div>
        </div>

        {/* Units Sold & Refunds */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-500 text-xs font-semibold">
            <span>Units & Refunds</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="font-mono text-2xl font-bold text-stone-900">
              {summary.totalUnitsSold} Units
            </span>
            <span className="text-[11px] text-red-600 font-mono block mt-0.5">
              Refunds: ₹{summary.totalRefunds.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

      </div>

      {/* Two Column Section: Payment Method Breakdown & Collection Contribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Payment Methods (5 cols) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-stone-100">
              <CreditCard className="w-4 h-4 text-[#762F39]" />
              <h3 className="font-serif font-bold text-base text-stone-900">
                Payment Channel Breakdown
              </h3>
            </div>

            <div className="space-y-3">
              {[
                { key: 'CASH', label: 'Cash at Counter', icon: Banknote, color: 'bg-emerald-600' },
                { key: 'UPI', label: 'UPI / QR Code', icon: Smartphone, color: 'bg-[#762F39]' },
                { key: 'CARD', label: 'POS Card Machine', icon: CreditCard, color: 'bg-blue-600' },
                { key: 'OTHER', label: 'Split / Other', icon: Layers, color: 'bg-stone-700' },
              ].map((item) => {
                const data = paymentBreakdown[item.key] || { count: 0, amount: 0 };
                const pct = summary.netSales > 0 ? (data.amount / summary.netSales) * 100 : 0;
                const IconComponent = item.icon;

                return (
                  <div key={item.key} className="bg-stone-50 p-3 rounded-xl border border-stone-200/80">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center gap-2">
                        <IconComponent className="w-4 h-4 text-stone-500" />
                        <span className="font-semibold text-stone-800">{item.label}</span>
                      </div>
                      <div className="text-right font-mono">
                        <span className="font-bold text-stone-900">₹{data.amount.toLocaleString('en-IN')}</span>
                        <span className="text-[10px] text-stone-500 ml-1.5">({data.count} bills)</span>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.color} rounded-full transition-all duration-500`}
                        style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Collection Contribution Table (7 cols) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-stone-100">
              <Boxes className="w-4 h-4 text-[#762F39]" />
              <h3 className="font-serif font-bold text-base text-stone-900">
                Four Amoga Collections Contribution
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF9F5] text-stone-500 font-semibold uppercase text-[10px] tracking-wider border-b border-stone-200">
                  <tr>
                    <th className="py-2.5 px-3">Collection</th>
                    <th className="py-2.5 px-3 text-center">Units Sold</th>
                    <th className="py-2.5 px-3 text-right">Revenue (₹)</th>
                    <th className="py-2.5 px-3 text-right">Share (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-mono">
                  {[
                    { key: 'food', name: 'Wholesome Pantry', tag: 'FOOD' },
                    { key: 'tea', name: 'Wellness Tea', tag: 'TEA' },
                    { key: 'sarees', name: 'Heritage Sarees', tag: 'SAREES' },
                    { key: 'jewellery', name: 'Silver Jewellery', tag: 'JEWELLERY' },
                  ].map((c) => {
                    const colData = collectionBreakdown[c.key] || { units: 0, amount: 0 };
                    const share = summary.grossSales > 0 ? (colData.amount / summary.grossSales) * 100 : 0;

                    return (
                      <tr key={c.key} className="hover:bg-stone-50/70">
                        <td className="py-3 px-3 font-sans font-medium text-stone-900 flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#762F39]" />
                          <span>{c.name}</span>
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-stone-800">
                          {colData.units}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-[#762F39]">
                          ₹{colData.amount.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3 text-right text-stone-600 font-semibold">
                          {share.toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

      {/* Event-wise Sales Summary */}
      {eventSales.length > 0 && (
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-stone-100">
            <MapPin className="w-4 h-4 text-[#762F39]" />
            <h3 className="font-serif font-bold text-base text-stone-900">
              Event & Venue Revenue Contribution
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {eventSales.map((ev, idx) => (
              <div key={idx} className="p-3 bg-[#FAF9F5] rounded-xl border border-stone-200">
                <span className="text-xs font-serif font-bold text-stone-900 block truncate">{ev.name}</span>
                <div className="mt-2 flex items-baseline justify-between text-xs font-mono">
                  <span className="text-stone-500">{ev.count} Bills</span>
                  <span className="text-sm font-bold text-[#762F39]">₹{ev.amount.toLocaleString('en-IN')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

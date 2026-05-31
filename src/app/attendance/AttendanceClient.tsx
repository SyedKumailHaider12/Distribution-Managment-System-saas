'use client';

import { useState } from 'react';
import { Calendar, Clock, CheckCircle, XCircle, Coffee, UserCheck, Users, Search, Filter, Download } from 'lucide-react';
import { markAttendance, bulkMarkAttendance } from './actions';
import { motion } from 'framer-motion';

interface Employee {
  id: number;
  name: string;
  employeeCode: string;
  branch: { name: string };
}

interface Attendance {
  id: number;
  date: Date;
  status: string;
  punchIn: Date | null;
  punchOut: Date | null;
  notes: string | null;
  employee: { name: string; employeeCode: string };
}

export function AttendanceClient({
  employees,
  attendances,
  todayAttendances,
}: {
  employees: Employee[];
  attendances: Attendance[];
  todayAttendances: Attendance[];
}) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  const filteredEmployees = employees.filter((emp) =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.employeeCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const todayMarked = todayAttendances.length;
  const todayPresent = todayAttendances.filter((a) => a.status === 'PRESENT').length;
  const todayAbsent = todayAttendances.filter((a) => a.status === 'ABSENT').length;
  const todayLeave = todayAttendances.filter((a) => a.status === 'LEAVE').length;

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PRESENT: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
      ABSENT: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      HALF_DAY: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      LEAVE: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${styles[status] || ''}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  const handleMark = async (employeeId: number, status: 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LEAVE') => {
    setLoading(true);
    try {
      const date = new Date(selectedDate);
      const punchIn = status === 'PRESENT' ? new Date() : undefined;
      await markAttendance({ employeeId, date, status, punchIn });
      window.location.reload();
    } catch (err) {
      alert('Failed to mark attendance');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkMark = async (status: 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LEAVE') => {
    if (selectedEmployees.length === 0) {
      alert('Please select employees first');
      return;
    }
    setLoading(true);
    try {
      const date = new Date(selectedDate);
      await bulkMarkAttendance({ employeeIds: selectedEmployees, date, status });
      setSelectedEmployees([]);
      window.location.reload();
    } catch (err) {
      alert('Failed to mark bulk attendance');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedEmployees((prev) =>
      prev.includes(id) ? prev.filter((eid) => eid !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedEmployees.length === filteredEmployees.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(filteredEmployees.map((e) => e.id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-white flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white shadow-lg shadow-blue-200 dark:shadow-none">
              <UserCheck className="w-7 h-7" />
            </div>
            Attendance Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Mark daily attendance and track employee presence
          </p>
        </div>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold shadow-sm"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Total Staff</p>
          <h3 className="text-3xl font-black text-slate-800 dark:text-white mt-1">{employees.length}</h3>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Present Today</p>
          <h3 className="text-3xl font-black text-emerald-600 mt-1">{todayPresent}</h3>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Absent Today</p>
          <h3 className="text-3xl font-black text-red-600 mt-1">{todayAbsent}</h3>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">On Leave</p>
          <h3 className="text-3xl font-black text-purple-600 mt-1">{todayLeave}</h3>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedEmployees.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-2xl flex items-center justify-between"
        >
          <p className="text-sm font-bold text-blue-700 dark:text-blue-400">
            {selectedEmployees.length} employee(s) selected
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handleBulkMark('PRESENT')}
              disabled={loading}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50"
            >
              Mark Present
            </button>
            <button
              onClick={() => handleBulkMark('ABSENT')}
              disabled={loading}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50"
            >
              Mark Absent
            </button>
            <button
              onClick={() => handleBulkMark('LEAVE')}
              disabled={loading}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50"
            >
              Mark Leave
            </button>
          </div>
        </motion.div>
      )}

      {/* Employee List */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <button
            onClick={selectAll}
            className="px-4 py-2 text-sm font-bold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all"
          >
            {selectedEmployees.length === filteredEmployees.length ? 'Deselect All' : 'Select All'}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-400 dark:text-slate-500 font-bold uppercase text-[10px] tracking-widest">
              <tr>
                <th className="px-6 py-4 w-12"></th>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Branch</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredEmployees.map((emp) => {
                const todayRecord = todayAttendances.find((a) => a.employee.employeeCode === emp.employeeCode);
                return (
                  <tr key={emp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedEmployees.includes(emp.id)}
                        onChange={() => toggleSelect(emp.id)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-bold text-sm">
                          {emp.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 dark:text-white">{emp.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                            {emp.employeeCode}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-medium">{emp.branch.name}</td>
                    <td className="px-6 py-4">
                      {todayRecord ? (
                        <div className="flex items-center justify-center gap-2">
                          {getStatusBadge(todayRecord.status)}
                          {todayRecord.punchIn && (
                            <span className="text-xs text-slate-400">
                              {new Date(todayRecord.punchIn).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleMark(emp.id, 'PRESENT')}
                            disabled={loading}
                            className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-all disabled:opacity-50"
                            title="Present"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleMark(emp.id, 'ABSENT')}
                            disabled={loading}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-50"
                            title="Absent"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleMark(emp.id, 'HALF_DAY')}
                            disabled={loading}
                            className="p-2 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-lg transition-all disabled:opacity-50"
                            title="Half Day"
                          >
                            <Coffee className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Attendance History */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700">
          <h2 className="text-lg font-black text-slate-800 dark:text-white">Recent Attendance Records</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-400 dark:text-slate-500 font-bold uppercase text-[10px] tracking-widest">
              <tr>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Punch In</th>
                <th className="px-6 py-4">Punch Out</th>
                <th className="px-6 py-4">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {attendances.slice(0, 20).map((att) => (
                <tr key={att.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-800 dark:text-white">{att.employee.name}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">{att.employee.employeeCode}</p>
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-medium">
                    {new Date(att.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(att.status)}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                    {att.punchIn
                      ? new Date(att.punchIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                      : '-'}
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                    {att.punchOut
                      ? new Date(att.punchOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                      : '-'}
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{att.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

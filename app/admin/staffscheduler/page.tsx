'use client';

import { useState, useEffect } from 'react';
import { staffAPI } from '@/lib/api';

interface StaffMember {
  _id: string;
  staffNumber: string;
  name: string;
  role: 'cleaner' | 'maintenance' | 'manager' | 'concierge' | 'supervisor';
  email: string;
  phone: string;
  status: 'active' | 'inactive' | 'on-leave';
  hireDate: string;
  salary?: number;
  schedule: WorkSchedule;
  department: string;
  createdAt: string;
  updatedAt: string;
}

interface WorkSchedule {
  monday: { start: string; end: string; working: boolean };
  tuesday: { start: string; end: string; working: boolean };
  wednesday: { start: string; end: string; working: boolean };
  thursday: { start: string; end: string; working: boolean };
  friday: { start: string; end: string; working: boolean };
  saturday: { start: string; end: string; working: boolean };
  sunday: { start: string; end: string; working: boolean };
}

interface AttendanceRecord {
  _id: string;
  attendanceNumber: string;
  staff: StaffMember;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: 'present' | 'absent' | 'late' | 'leave' | 'half-day';
  hoursWorked?: number;
  lateMinutes?: number;
  overtimeMinutes?: number;
  location?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface DailyReport {
  _id: string;
  reportNumber: string;
  staff: StaffMember;
  date: string;
  tasksCompleted: string[];
  issuesReported: string[];
  suppliesUsed: string[];
  guestFeedback?: string;
  notes?: string;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
}

interface LeaveRequest {
  _id: string;
  requestNumber: string;
  staff: StaffMember;
  type: 'sick' | 'vacation' | 'personal' | 'emergency';
  startDate: string;
  endDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedBy?: any;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface StaffStats {
  totalStaff: number;
  activeStaff: number;
  onLeaveStaff: number;
  presentToday: number;
  lateToday: number;
  totalOvertimeThisMonth: number;
  roleStats: Array<{ _id: string; count: number }>;
  departmentStats: Array<{ _id: string; count: number }>;
}

export default function StaffScheduler() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [dailyReports, setDailyReports] = useState<DailyReport[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [stats, setStats] = useState<StaffStats | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState<'attendance' | 'schedule' | 'reports' | 'leaves'>('attendance');
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [newStaff, setNewStaff] = useState({
    name: '',
    role: 'cleaner' as StaffMember['role'],
    email: '',
    phone: '',
    department: '',
    salary: 0
  });

  const [dailyReport, setDailyReport] = useState({
    tasksCompleted: [''],
    issuesReported: [''],
    suppliesUsed: [''],
    guestFeedback: '',
    notes: ''
  });

  const [leaveRequest, setLeaveRequest] = useState({
    type: 'vacation' as LeaveRequest['type'],
    startDate: new Date(),
    endDate: new Date(),
    reason: ''
  });

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [staffResponse, attendanceResponse, reportsResponse, leavesResponse, statsResponse] = await Promise.all([
        staffAPI.getStaff(),
        staffAPI.getAttendance({ limit: 50 }),
        staffAPI.getReports({ limit: 50 }),
        staffAPI.getLeaveRequests({ limit: 50 }),
        staffAPI.getStaffStats()
      ]);
      
      setStaff(staffResponse.staff || []);
      setAttendance(attendanceResponse.attendance || []);
      setDailyReports(reportsResponse.reports || []);
      setLeaveRequests(leavesResponse.leaveRequests || []);
      setStats(statsResponse.stats);
      
    } catch (error: any) {
      console.error('Failed to fetch staff data:', error);
      setError(error.response?.data?.message || 'Failed to load staff data');
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const isStaffScheduledToday = (staff: StaffMember) => {
    const today = new Date().getDay();
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return staff.schedule[days[today] as keyof WorkSchedule].working;
  };

  const getTodayAttendanceRecord = (staffId: string) => {
    const today = new Date().toDateString();
    return attendance.find(record => 
      record.staff._id === staffId && 
      new Date(record.date).toDateString() === today
    );
  };

  // Manual check-in function
  const manualCheckIn = async (staffId: string) => {
    try {
      const response = await staffAPI.checkIn({
        staffId,
        location: 'Manual entry'
      });
      
      setAttendance([response.attendance, ...attendance]);
      alert('Check-in recorded successfully!');
    } catch (error: any) {
      console.error('Check-in error:', error);
      alert(error.response?.data?.message || 'Failed to record check-in');
    }
  };

  // Manual check-out function
  const manualCheckOut = async (staffId: string) => {
    try {
      const response = await staffAPI.checkOut({
        staffId
      });
      
      setAttendance(attendance.map(record => 
        record._id === response.attendance._id ? response.attendance : record
      ));
      alert('Check-out recorded successfully!');
    } catch (error: any) {
      console.error('Check-out error:', error);
      alert(error.response?.data?.message || 'Failed to record check-out');
    }
  };

  // Add staff function
  const addStaffMember = async () => {
    try {
      const response = await staffAPI.createStaff(newStaff);
      
      setStaff([...staff, response.staff]);
      setShowAddStaff(false);
      setNewStaff({
        name: '',
        role: 'cleaner',
        email: '',
        phone: '',
        department: '',
        salary: 0
      });
      
      alert('Staff member added successfully!');
    } catch (error: any) {
      console.error('Add staff error:', error);
      alert(error.response?.data?.message || 'Failed to add staff member');
    }
  };

  // Submit daily report function
  const submitDailyReport = async () => {
    if (!selectedStaff) return;

    try {
      const response = await staffAPI.createReport({
        staffId: selectedStaff._id,
        tasksCompleted: dailyReport.tasksCompleted.filter(task => task.trim() !== ''),
        issuesReported: dailyReport.issuesReported.filter(issue => issue.trim() !== ''),
        suppliesUsed: dailyReport.suppliesUsed.filter(supply => supply.trim() !== ''),
        guestFeedback: dailyReport.guestFeedback,
        notes: dailyReport.notes
      });

      setDailyReports([response.report, ...dailyReports]);
      setShowReportModal(false);
      setDailyReport({
        tasksCompleted: [''],
        issuesReported: [''],
        suppliesUsed: [''],
        guestFeedback: '',
        notes: ''
      });
      
      alert('Daily report submitted successfully!');
    } catch (error: any) {
      console.error('Submit report error:', error);
      alert(error.response?.data?.message || 'Failed to submit daily report');
    }
  };

  // Submit leave request function
  const submitLeaveRequest = async () => {
    if (!selectedStaff) return;

    try {
      const response = await staffAPI.createLeaveRequest({
        staffId: selectedStaff._id,
        type: leaveRequest.type,
        startDate: leaveRequest.startDate.toISOString().split('T')[0],
        endDate: leaveRequest.endDate.toISOString().split('T')[0],
        reason: leaveRequest.reason
      });

      setLeaveRequests([response.leaveRequest, ...leaveRequests]);
      setShowLeaveModal(false);
      setLeaveRequest({
        type: 'vacation',
        startDate: new Date(),
        endDate: new Date(),
        reason: ''
      });
      
      alert('Leave request submitted successfully!');
    } catch (error: any) {
      console.error('Submit leave request error:', error);
      alert(error.response?.data?.message || 'Failed to submit leave request');
    }
  };

  // Update leave status function
  const updateLeaveStatus = async (leaveId: string, status: 'approved' | 'rejected') => {
    try {
      const response = await staffAPI.updateLeaveStatus(leaveId, { status });
      
      setLeaveRequests(leaveRequests.map(request => 
        request._id === leaveId ? response.leaveRequest : request
      ));
      
      alert(`Leave request ${status} successfully!`);
    } catch (error: any) {
      console.error('Update leave status error:', error);
      alert(error.response?.data?.message || 'Failed to update leave status');
    }
  };

  // Add task/issue/supply field
  const addField = (field: 'tasksCompleted' | 'issuesReported' | 'suppliesUsed') => {
    setDailyReport({
      ...dailyReport,
      [field]: [...dailyReport[field], '']
    });
  };

  // Remove task/issue/supply field
  const removeField = (field: 'tasksCompleted' | 'issuesReported' | 'suppliesUsed', index: number) => {
    const newFields = dailyReport[field].filter((_, i) => i !== index);
    setDailyReport({
      ...dailyReport,
      [field]: newFields
    });
  };

  // Update field value
  const updateField = (field: 'tasksCompleted' | 'issuesReported' | 'suppliesUsed', index: number, value: string) => {
    const newFields = [...dailyReport[field]];
    newFields[index] = value;
    setDailyReport({
      ...dailyReport,
      [field]: newFields
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-[#383a3c]">Staff Management</h2>
            <p className="text-gray-600">Loading staff data...</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f06123]"></div>
          <span className="ml-3 text-gray-600">Loading staff data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-[#383a3c]">Staff Management</h2>
          <p className="text-gray-600">Current time: {currentTime.toLocaleString()}</p>
        </div>
        <button 
          onClick={() => setShowAddStaff(true)}
          className="bg-[#f06123] text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition duration-200 cursor-pointer"
        >
          + Add Staff
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-700">{error}</span>
            </div>
            <button
              onClick={() => setError('')}
              className="text-red-700 hover:text-red-800 font-medium cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* View Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-1">
        <div className="flex space-x-1">
          {(['attendance', 'schedule', 'reports', 'leaves'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setView(tab)}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition duration-200 cursor-pointer ${
                view === tab
                  ? 'bg-[#f06123] text-white shadow-sm'
                  : 'text-gray-600 hover:text-[#383a3c] hover:bg-gray-100'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <div className="text-2xl font-bold text-green-600">{stats.presentToday}</div>
            <div className="text-gray-600">Present Today</div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <div className="text-2xl font-bold text-yellow-600">{stats.lateToday}</div>
            <div className="text-gray-600">Late Today</div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <div className="text-2xl font-bold text-blue-600">{stats.onLeaveStaff}</div>
            <div className="text-gray-600">On Leave</div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <div className="text-2xl font-bold text-purple-600">{stats.totalOvertimeThisMonth.toFixed(1)}h</div>
            <div className="text-gray-600">Overtime This Month</div>
          </div>
        </div>
      )}

      {/* Attendance View */}
      {view === 'attendance' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Today's Attendance ({new Date().toLocaleDateString()})</h3>
            <div className="space-y-4">
              {staff.map((member) => {
                const todayRecord = getTodayAttendanceRecord(member._id);
                const isScheduledToday = isStaffScheduledToday(member);
                
                return (
                  <div key={member._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${
                        todayRecord?.checkIn && !todayRecord.checkOut ? 'bg-green-500' :
                        todayRecord?.checkOut ? 'bg-gray-400' :
                        isScheduledToday ? 'bg-yellow-500' : 'bg-red-500'
                      }`}></div>
                      <div>
                        <div className="font-medium text-[#383a3c]">{member.name}</div>
                        <div className="text-gray-500 text-sm capitalize">{member.role} • {member.department}</div>
                        {member.schedule && (
                          <div className="text-gray-400 text-xs">
                            Schedule: {Object.entries(member.schedule)
                              .filter(([_, day]) => day.working)
                              .map(([day, _]) => day.slice(0, 3))
                              .join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm text-gray-600">
                        {todayRecord?.checkIn ? `In: ${new Date(todayRecord.checkIn).toLocaleTimeString()}` : 
                         isScheduledToday ? 'Scheduled' : 'Off today'}
                      </div>
                      <div className="text-sm text-gray-600">
                        {todayRecord?.checkOut ? `Out: ${new Date(todayRecord.checkOut).toLocaleTimeString()}` : ''}
                      </div>
                      {todayRecord?.hoursWorked && (
                        <div className="text-sm font-medium text-green-600">
                          {todayRecord.hoursWorked.toFixed(1)} hours
                          {todayRecord.lateMinutes && todayRecord.lateMinutes > 0 && (
                            <span className="text-red-600 ml-2">({todayRecord.lateMinutes}m late)</span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="space-x-2">
                      {!todayRecord && isScheduledToday && (
                        <button
                          onClick={() => manualCheckIn(member._id)}
                          className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-600 cursor-pointer"
                        >
                          Check In
                        </button>
                      )}
                      {todayRecord?.checkIn && !todayRecord.checkOut && (
                        <>
                          <button
                            onClick={() => manualCheckOut(member._id)}
                            className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-600 cursor-pointer"
                          >
                            Check Out
                          </button>
                          <button
                            onClick={() => {
                              setSelectedStaff(member);
                              setShowReportModal(true);
                            }}
                            className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-600 cursor-pointer"
                          >
                            Submit Report
                          </button>
                        </>
                      )}
                      {todayRecord?.checkOut && (
                        <button
                          onClick={() => {
                            setSelectedStaff(member);
                            setShowReportModal(true);
                          }}
                          className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-600 cursor-pointer"
                        >
                          View Report
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Attendance History */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Attendance</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Staff</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Check In</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Check Out</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Hours</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {attendance.slice(0, 10).map((record) => (
                    <tr key={record._id}>
                      <td className="px-4 py-2 text-sm text-gray-900">{record.staff.name}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{new Date(record.date).toLocaleDateString()}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {record.checkIn ? new Date(record.checkIn).toLocaleTimeString() : '-'}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {record.checkOut ? new Date(record.checkOut).toLocaleTimeString() : '-'}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {record.hoursWorked ? record.hoursWorked.toFixed(1) : '-'}
                      </td>
                      <td className="px-4 py-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          record.status === 'present' ? 'bg-green-100 text-green-800' :
                          record.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                          record.status === 'absent' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {record.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Schedule View */}
      {view === 'schedule' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Staff Schedules</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Staff</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                    <th key={day} className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {staff.map((member) => (
                  <tr key={member._id}>
                    <td className="px-4 py-2 text-sm font-medium text-gray-900">{member.name}</td>
                    <td className="px-4 py-2 text-sm text-gray-500 capitalize">{member.role}</td>
                    {Object.entries(member.schedule).map(([day, schedule]) => (
                      <td key={day} className="px-4 py-2 text-center">
                        {schedule.working ? (
                          <div className="text-xs text-green-600">
                            {schedule.start} - {schedule.end}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-400">Off</div>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reports View */}
      {view === 'reports' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Daily Reports</h3>
            <button
              onClick={() => {
                if (staff.length > 0) {
                  setSelectedStaff(staff[0]);
                  setShowReportModal(true);
                }
              }}
              className="bg-[#f06123] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-orange-600 cursor-pointer"
            >
              + New Report
            </button>
          </div>
          <div className="space-y-4">
            {dailyReports.map((report) => (
              <div key={report._id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="font-medium text-gray-900">{report.staff.name}</div>
                    <div className="text-sm text-gray-500">{new Date(report.date).toLocaleDateString()}</div>
                  </div>
                  <div className="text-sm text-gray-500">
                    Submitted: {new Date(report.submittedAt).toLocaleTimeString()}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="font-medium text-gray-700 mb-1">Tasks Completed</div>
                    <ul className="list-disc list-inside text-gray-600">
                      {report.tasksCompleted.map((task, index) => (
                        <li key={index}>{task}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="font-medium text-gray-700 mb-1">Issues Reported</div>
                    <ul className="list-disc list-inside text-gray-600">
                      {report.issuesReported.map((issue, index) => (
                        <li key={index}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="font-medium text-gray-700 mb-1">Supplies Used</div>
                    <ul className="list-disc list-inside text-gray-600">
                      {report.suppliesUsed.map((supply, index) => (
                        <li key={index}>{supply}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {(report.guestFeedback || report.notes) && (
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {report.guestFeedback && (
                      <div>
                        <div className="font-medium text-gray-700 mb-1">Guest Feedback</div>
                        <p className="text-gray-600">{report.guestFeedback}</p>
                      </div>
                    )}
                    {report.notes && (
                      <div>
                        <div className="font-medium text-gray-700 mb-1">Additional Notes</div>
                        <p className="text-gray-600">{report.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Leave Requests View */}
      {view === 'leaves' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Leave Requests</h3>
              <button
                onClick={() => {
                  if (staff.length > 0) {
                    setSelectedStaff(staff[0]);
                    setShowLeaveModal(true);
                  }
                }}
                className="bg-[#f06123] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-orange-600 cursor-pointer"
              >
                + Request Leave
              </button>
            </div>
            <div className="space-y-4">
              {leaveRequests.map((request) => (
                <div key={request._id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="font-medium text-gray-900">{request.staff.name}</div>
                      <div className="text-sm text-gray-500 capitalize">{request.type} Leave</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        request.status === 'approved' ? 'bg-green-100 text-green-800' :
                        request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {request.status}
                      </span>
                      {request.status === 'pending' && (
                        <div className="flex space-x-1">
                          <button
                            onClick={() => updateLeaveStatus(request._id, 'approved')}
                            className="text-green-600 hover:text-green-700 cursor-pointer text-sm"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => updateLeaveStatus(request._id, 'rejected')}
                            className="text-red-600 hover:text-red-700 cursor-pointer text-sm"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="font-medium text-gray-700">Dates</div>
                      <div className="text-gray-600">
                        {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                      </div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-700">Reason</div>
                      <div className="text-gray-600">{request.reason}</div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-700">Submitted</div>
                      <div className="text-gray-600">{new Date(request.submittedAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {showAddStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Add Staff Member</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={newStaff.name}
                  onChange={(e) => setNewStaff({...newStaff, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={newStaff.role}
                  onChange={(e) => setNewStaff({...newStaff, role: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] cursor-pointer"
                >
                  <option value="cleaner">Cleaner</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="concierge">Concierge</option>
                  <option value="manager">Manager</option>
                  <option value="supervisor">Supervisor</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <input
                  type="text"
                  value={newStaff.department}
                  onChange={(e) => setNewStaff({...newStaff, department: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                  placeholder="Enter department"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={newStaff.email}
                  onChange={(e) => setNewStaff({...newStaff, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="text"
                  value={newStaff.phone}
                  onChange={(e) => setNewStaff({...newStaff, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                  placeholder="Enter phone number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Salary ($)</label>
                <input
                  type="number"
                  value={newStaff.salary}
                  onChange={(e) => setNewStaff({...newStaff, salary: parseFloat(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                  placeholder="Enter monthly salary"
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowAddStaff(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={addStaffMember}
                  className="flex-1 px-4 py-2 bg-[#f06123] text-white rounded-lg font-semibold hover:bg-orange-600 cursor-pointer"
                >
                  Add Staff
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Daily Report Modal */}
      {showReportModal && selectedStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Daily Work Report - {selectedStaff.name}</h3>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tasks Completed Today</label>
                {dailyReport.tasksCompleted.map((task, index) => (
                  <div key={index} className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={task}
                      onChange={(e) => updateField('tasksCompleted', index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                      placeholder="Describe completed task..."
                    />
                    {dailyReport.tasksCompleted.length > 1 && (
                      <button
                        onClick={() => removeField('tasksCompleted', index)}
                        className="bg-red-100 text-red-600 px-3 py-2 rounded-lg hover:bg-red-200 cursor-pointer"
                      >
                        -
                      </button>
                    )}
                    {index === dailyReport.tasksCompleted.length - 1 && (
                      <button
                        onClick={() => addField('tasksCompleted')}
                        className="bg-gray-200 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-300 cursor-pointer"
                      >
                        +
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Issues Encountered</label>
                {dailyReport.issuesReported.map((issue, index) => (
                  <div key={index} className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={issue}
                      onChange={(e) => updateField('issuesReported', index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                      placeholder="Describe any issues..."
                    />
                    {dailyReport.issuesReported.length > 1 && (
                      <button
                        onClick={() => removeField('issuesReported', index)}
                        className="bg-red-100 text-red-600 px-3 py-2 rounded-lg hover:bg-red-200 cursor-pointer"
                      >
                        -
                      </button>
                    )}
                    {index === dailyReport.issuesReported.length - 1 && (
                      <button
                        onClick={() => addField('issuesReported')}
                        className="bg-gray-200 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-300 cursor-pointer"
                      >
                        +
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Supplies Used</label>
                {dailyReport.suppliesUsed.map((supply, index) => (
                  <div key={index} className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={supply}
                      onChange={(e) => updateField('suppliesUsed', index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                      placeholder="List supplies used..."
                    />
                    {dailyReport.suppliesUsed.length > 1 && (
                      <button
                        onClick={() => removeField('suppliesUsed', index)}
                        className="bg-red-100 text-red-600 px-3 py-2 rounded-lg hover:bg-red-200 cursor-pointer"
                      >
                        -
                      </button>
                    )}
                    {index === dailyReport.suppliesUsed.length - 1 && (
                      <button
                        onClick={() => addField('suppliesUsed')}
                        className="bg-gray-200 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-300 cursor-pointer"
                      >
                        +
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Guest Feedback</label>
                <textarea
                  value={dailyReport.guestFeedback}
                  onChange={(e) => setDailyReport({...dailyReport, guestFeedback: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                  placeholder="Any guest feedback received..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes</label>
                <textarea
                  value={dailyReport.notes}
                  onChange={(e) => setDailyReport({...dailyReport, notes: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                  placeholder="Any additional notes or comments..."
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowReportModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={submitDailyReport}
                  className="flex-1 px-4 py-2 bg-[#f06123] text-white rounded-lg font-semibold hover:bg-orange-600 cursor-pointer"
                >
                  Submit Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leave Request Modal */}
      {showLeaveModal && selectedStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Request Leave - {selectedStaff.name}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type</label>
                <select
                  value={leaveRequest.type}
                  onChange={(e) => setLeaveRequest({...leaveRequest, type: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] cursor-pointer"
                >
                  <option value="vacation">Vacation</option>
                  <option value="sick">Sick Leave</option>
                  <option value="personal">Personal</option>
                  <option value="emergency">Emergency</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={leaveRequest.startDate.toISOString().split('T')[0]}
                    onChange={(e) => setLeaveRequest({...leaveRequest, startDate: new Date(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={leaveRequest.endDate.toISOString().split('T')[0]}
                    onChange={(e) => setLeaveRequest({...leaveRequest, endDate: new Date(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <textarea
                  value={leaveRequest.reason}
                  onChange={(e) => setLeaveRequest({...leaveRequest, reason: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
                  placeholder="Reason for leave request..."
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowLeaveModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={submitLeaveRequest}
                  className="flex-1 px-4 py-2 bg-[#f06123] text-white rounded-lg font-semibold hover:bg-orange-600 cursor-pointer"
                >
                  Submit Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}























































// // components/admin/operational/StaffScheduler.tsx
// 'use client';

// import { useState, useEffect } from 'react';

// interface StaffMember {
//   id: string;
//   name: string;
//   role: 'cleaner' | 'maintenance' | 'manager' | 'concierge' | 'supervisor';
//   email: string;
//   phone: string;
//   status: 'active' | 'inactive' | 'on-leave';
//   hireDate: Date;
//   salary?: number;
//   schedule: WorkSchedule;
//   department: string;
// }

// interface WorkSchedule {
//   monday: { start: string; end: string; working: boolean };
//   tuesday: { start: string; end: string; working: boolean };
//   wednesday: { start: string; end: string; working: boolean };
//   thursday: { start: string; end: string; working: boolean };
//   friday: { start: string; end: string; working: boolean };
//   saturday: { start: string; end: string; working: boolean };
//   sunday: { start: string; end: string; working: boolean };
// }

// interface AttendanceRecord {
//   id: string;
//   staffId: string;
//   date: Date;
//   checkIn?: Date;
//   checkOut?: Date;
//   status: 'present' | 'absent' | 'late' | 'leave' | 'half-day';
//   hoursWorked?: number;
//   lateMinutes?: number;
//   overtimeMinutes?: number;
//   location?: string;
//   notes?: string;
// }

// interface DailyReport {
//   id: string;
//   staffId: string;
//   date: Date;
//   tasksCompleted: string[];
//   issuesReported: string[];
//   suppliesUsed: string[];
//   guestFeedback?: string;
//   notes?: string;
//   submittedAt: Date;
// }

// interface LeaveRequest {
//   id: string;
//   staffId: string;
//   type: 'sick' | 'vacation' | 'personal' | 'emergency';
//   startDate: Date;
//   endDate: Date;
//   reason: string;
//   status: 'pending' | 'approved' | 'rejected';
//   submittedAt: Date;
//   reviewedBy?: string;
//   reviewedAt?: Date;
// }

// export default function StaffScheduler() {
//   const [staff, setStaff] = useState<StaffMember[]>([
//     {
//       id: 'STF-001',
//       name: 'John Smith',
//       role: 'cleaner',
//       email: 'john.smith@holsapartment.com',
//       phone: '+1-555-0101',
//       status: 'active',
//       hireDate: new Date('2023-03-15'),
//       salary: 3200,
//       department: 'Housekeeping',
//       schedule: {
//         monday: { start: '09:00', end: '17:00', working: true },
//         tuesday: { start: '09:00', end: '17:00', working: true },
//         wednesday: { start: '09:00', end: '17:00', working: true },
//         thursday: { start: '09:00', end: '17:00', working: true },
//         friday: { start: '09:00', end: '17:00', working: true },
//         saturday: { start: '10:00', end: '14:00', working: false },
//         sunday: { start: '10:00', end: '14:00', working: false }
//       }
//     },
//     {
//       id: 'STF-002',
//       name: 'Maria Garcia',
//       role: 'maintenance',
//       email: 'maria.garcia@holsapartment.com',
//       phone: '+1-555-0102',
//       status: 'active',
//       hireDate: new Date('2023-01-10'),
//       salary: 3800,
//       department: 'Maintenance',
//       schedule: {
//         monday: { start: '08:00', end: '16:00', working: true },
//         tuesday: { start: '08:00', end: '16:00', working: true },
//         wednesday: { start: '08:00', end: '16:00', working: true },
//         thursday: { start: '08:00', end: '16:00', working: true },
//         friday: { start: '08:00', end: '16:00', working: true },
//         saturday: { start: '09:00', end: '13:00', working: true },
//         sunday: { start: '09:00', end: '13:00', working: false }
//       }
//     }
//   ]);

//   const [attendance, setAttendance] = useState<AttendanceRecord[]>([
//     {
//       id: 'ATT-001',
//       staffId: 'STF-001',
//       date: new Date(),
//       checkIn: new Date(new Date().setHours(8, 55, 0)),
//       status: 'present',
//       hoursWorked: 4.5,
//       location: 'Main Office'
//     }
//   ]);

//   const [dailyReports, setDailyReports] = useState<DailyReport[]>([]);
//   const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
//   const [currentTime, setCurrentTime] = useState(new Date());
//   const [selectedDate, setSelectedDate] = useState(new Date());
//   const [view, setView] = useState<'attendance' | 'schedule' | 'reports' | 'leaves'>('attendance');
//   const [showAddStaff, setShowAddStaff] = useState(false);
//   const [showReportModal, setShowReportModal] = useState(false);
//   const [showLeaveModal, setShowLeaveModal] = useState(false);
//   const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);

//   const [newStaff, setNewStaff] = useState({
//     name: '',
//     role: 'cleaner' as StaffMember['role'],
//     email: '',
//     phone: '',
//     department: '',
//     salary: 0
//   });

//   const [dailyReport, setDailyReport] = useState({
//     tasksCompleted: [''],
//     issuesReported: [''],
//     suppliesUsed: [''],
//     guestFeedback: '',
//     notes: ''
//   });

//   const [leaveRequest, setLeaveRequest] = useState({
//     type: 'vacation' as LeaveRequest['type'],
//     startDate: new Date(),
//     endDate: new Date(),
//     reason: ''
//   });

//   useEffect(() => {
//     const timer = setInterval(() => {
//       setCurrentTime(new Date());
//     }, 1000);
//     return () => clearInterval(timer);
//   }, []);

//   // Auto-check in/out simulation
//   useEffect(() => {
//     const interval = setInterval(() => {
//       staff.forEach(member => {
//         if (member.status === 'active' && isStaffScheduledToday(member)) {
//           const todayRecord = attendance.find(a => 
//             a.staffId === member.id && 
//             a.date.toDateString() === new Date().toDateString()
//           );

//           if (!todayRecord && isWithinShiftTime(member)) {
//             // Auto check-in when within shift time
//             handleAutoCheckIn(member.id);
//           } else if (todayRecord && !todayRecord.checkOut && isAfterShiftTime(member)) {
//             // Auto check-out when shift ends
//             handleAutoCheckOut(member.id);
//           }
//         }
//       });
//     }, 30000); // Check every 30 seconds

//     return () => clearInterval(interval);
//   }, [staff, attendance]);

//   const isStaffScheduledToday = (staff: StaffMember) => {
//     const today = new Date().getDay();
//     const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
//     return staff.schedule[days[today] as keyof WorkSchedule].working;
//   };

//   const isWithinShiftTime = (staff: StaffMember) => {
//     const today = new Date().getDay();
//     const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
//     const schedule = staff.schedule[days[today] as keyof WorkSchedule];
    
//     if (!schedule.working) return false;

//     const [startHour, startMinute] = schedule.start.split(':').map(Number);
//     const [endHour, endMinute] = schedule.end.split(':').map(Number);
    
//     const now = new Date();
//     const shiftStart = new Date();
//     shiftStart.setHours(startHour, startMinute, 0, 0);
    
//     const shiftEnd = new Date();
//     shiftEnd.setHours(endHour, endMinute, 0, 0);

//     return now >= shiftStart && now <= shiftEnd;
//   };

//   const isAfterShiftTime = (staff: StaffMember) => {
//     const today = new Date().getDay();
//     const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
//     const schedule = staff.schedule[days[today] as keyof WorkSchedule];
    
//     const [endHour, endMinute] = schedule.end.split(':').map(Number);
//     const shiftEnd = new Date();
//     shiftEnd.setHours(endHour, endMinute, 0, 0);

//     return new Date() > shiftEnd;
//   };

//   const handleAutoCheckIn = (staffId: string) => {
//     const existingRecord = attendance.find(a => 
//       a.staffId === staffId && a.date.toDateString() === new Date().toDateString()
//     );

//     if (!existingRecord) {
//       const record: AttendanceRecord = {
//         id: `ATT-${Date.now()}`,
//         staffId,
//         date: new Date(),
//         checkIn: new Date(),
//         status: 'present',
//         location: 'Auto-detected'
//       };
//       setAttendance([record, ...attendance]);
//     }
//   };

//   const handleAutoCheckOut = (staffId: string) => {
//     setAttendance(attendance.map(record => {
//       if (record.staffId === staffId && !record.checkOut && record.date.toDateString() === new Date().toDateString()) {
//         const checkIn = record.checkIn || new Date();
//         const checkOut = new Date();
//         const hoursWorked = calculateHoursWorked(checkIn, checkOut);
//         const lateMinutes = calculateLateMinutes(staffId, checkIn);
        
//         return {
//           ...record,
//           checkOut,
//           hoursWorked,
//           lateMinutes,
//           overtimeMinutes: calculateOvertime(staffId, hoursWorked)
//         };
//       }
//       return record;
//     }));
//   };

//   const calculateHoursWorked = (checkIn: Date, checkOut: Date) => {
//     return (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
//   };

//   const calculateLateMinutes = (staffId: string, checkIn: Date) => {
//     const staffMember = staff.find(s => s.id === staffId);
//     if (!staffMember) return 0;

//     const today = new Date().getDay();
//     const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
//     const schedule = staffMember.schedule[days[today] as keyof WorkSchedule];
//     const [scheduledHour, scheduledMinute] = schedule.start.split(':').map(Number);

//     const scheduledTime = new Date();
//     scheduledTime.setHours(scheduledHour, scheduledMinute, 0, 0);

//     return checkIn > scheduledTime ? Math.max(0, (checkIn.getTime() - scheduledTime.getTime()) / (1000 * 60)) : 0;
//   };

//   const calculateOvertime = (staffId: string, hoursWorked: number) => {
//     const staffMember = staff.find(s => s.id === staffId);
//     if (!staffMember) return 0;

//     const today = new Date().getDay();
//     const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
//     const schedule = staffMember.schedule[days[today] as keyof WorkSchedule];
//     const [startHour, startMinute] = schedule.start.split(':').map(Number);
//     const [endHour, endMinute] = schedule.end.split(':').map(Number);

//     const scheduledHours = (endHour + endMinute/60) - (startHour + startMinute/60);
//     const overtime = hoursWorked - scheduledHours;

//     return Math.max(0, overtime * 60); // Convert to minutes
//   };

//   const manualCheckIn = (staffId: string) => {
//     const record: AttendanceRecord = {
//       id: `ATT-${Date.now()}`,
//       staffId,
//       date: new Date(),
//       checkIn: new Date(),
//       status: 'present',
//       location: 'Manual entry'
//     };
//     setAttendance([record, ...attendance]);
//   };

//   const manualCheckOut = (staffId: string) => {
//     setAttendance(attendance.map(record => {
//       if (record.staffId === staffId && !record.checkOut && record.date.toDateString() === new Date().toDateString()) {
//         const checkOut = new Date();
//         const hoursWorked = calculateHoursWorked(record.checkIn!, checkOut);
        
//         return {
//           ...record,
//           checkOut,
//           hoursWorked,
//           overtimeMinutes: calculateOvertime(staffId, hoursWorked)
//         };
//       }
//       return record;
//     }));
//   };

//   const addStaffMember = () => {
//     const staffMember: StaffMember = {
//       id: `STF-${String(staff.length + 1).padStart(3, '0')}`,
//       ...newStaff,
//       status: 'active',
//       hireDate: new Date(),
//       schedule: {
//         monday: { start: '09:00', end: '17:00', working: true },
//         tuesday: { start: '09:00', end: '17:00', working: true },
//         wednesday: { start: '09:00', end: '17:00', working: true },
//         thursday: { start: '09:00', end: '17:00', working: true },
//         friday: { start: '09:00', end: '17:00', working: true },
//         saturday: { start: '10:00', end: '14:00', working: false },
//         sunday: { start: '10:00', end: '14:00', working: false }
//       }
//     };
    
//     setStaff([...staff, staffMember]);
//     setShowAddStaff(false);
//     setNewStaff({
//       name: '',
//       role: 'cleaner',
//       email: '',
//       phone: '',
//       department: '',
//       salary: 0
//     });
//   };

//   const submitDailyReport = () => {
//     if (!selectedStaff) return;

//     const report: DailyReport = {
//       id: `RPT-${Date.now()}`,
//       staffId: selectedStaff.id,
//       date: new Date(),
//       tasksCompleted: dailyReport.tasksCompleted.filter(task => task.trim() !== ''),
//       issuesReported: dailyReport.issuesReported.filter(issue => issue.trim() !== ''),
//       suppliesUsed: dailyReport.suppliesUsed.filter(supply => supply.trim() !== ''),
//       guestFeedback: dailyReport.guestFeedback,
//       notes: dailyReport.notes,
//       submittedAt: new Date()
//     };

//     setDailyReports([report, ...dailyReports]);
//     setShowReportModal(false);
//     setDailyReport({
//       tasksCompleted: [''],
//       issuesReported: [''],
//       suppliesUsed: [''],
//       guestFeedback: '',
//       notes: ''
//     });
//   };

//   const submitLeaveRequest = () => {
//     if (!selectedStaff) return;

//     const request: LeaveRequest = {
//       id: `LEAVE-${Date.now()}`,
//       staffId: selectedStaff.id,
//       type: leaveRequest.type,
//       startDate: leaveRequest.startDate,
//       endDate: leaveRequest.endDate,
//       reason: leaveRequest.reason,
//       status: 'pending',
//       submittedAt: new Date()
//     };

//     setLeaveRequests([request, ...leaveRequests]);
//     setShowLeaveModal(false);
//     setLeaveRequest({
//       type: 'vacation',
//       startDate: new Date(),
//       endDate: new Date(),
//       reason: ''
//     });
//   };

//   const updateLeaveStatus = (leaveId: string, status: 'approved' | 'rejected') => {
//     setLeaveRequests(leaveRequests.map(request => 
//       request.id === leaveId 
//         ? { 
//             ...request, 
//             status, 
//             reviewedBy: 'Admin',
//             reviewedAt: new Date()
//           }
//         : request
//     ));
//   };

//   // Statistics calculations
//   const presentToday = attendance.filter(a => 
//     a.date.toDateString() === new Date().toDateString() && 
//     a.status === 'present'
//   ).length;

//   const lateToday = attendance.filter(a => 
//     a.date.toDateString() === new Date().toDateString() && 
//     a.lateMinutes && a.lateMinutes > 0
//   ).length;

//   const onLeaveToday = staff.filter(s => 
//     s.status === 'on-leave' || 
//     leaveRequests.some(lr => 
//       lr.staffId === s.id && 
//       lr.status === 'approved' && 
//       lr.startDate <= new Date() && 
//       lr.endDate >= new Date()
//     )
//   ).length;

//   const totalOvertimeThisMonth = attendance
//     .filter(a => 
//       a.date.getMonth() === new Date().getMonth() &&
//       a.overtimeMinutes
//     )
//     .reduce((total, a) => total + (a.overtimeMinutes || 0), 0) / 60;

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex justify-between items-center">
//         <div>
//           <h2 className="text-2xl font-bold text-[#383a3c]">Staff Management</h2>
//           <p className="text-gray-600">Current time: {currentTime.toLocaleString()}</p>
//         </div>
//         <button 
//           onClick={() => setShowAddStaff(true)}
//           className="bg-[#f06123] text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition duration-200 cursor-pointer"
//         >
//           + Add Staff
//         </button>
//       </div>

//       {/* View Tabs */}
//       <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-1">
//         <div className="flex space-x-1">
//           {(['attendance', 'schedule', 'reports', 'leaves'] as const).map((tab) => (
//             <button
//               key={tab}
//               onClick={() => setView(tab)}
//               className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition duration-200 cursor-pointer ${
//                 view === tab
//                   ? 'bg-[#f06123] text-white shadow-sm'
//                   : 'text-gray-600 hover:text-[#383a3c] hover:bg-gray-100'
//               }`}
//             >
//               {tab.charAt(0).toUpperCase() + tab.slice(1)}
//             </button>
//           ))}
//         </div>
//       </div>

//       {/* Stats Overview */}
//       <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//         <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
//           <div className="text-2xl font-bold text-green-600">{presentToday}</div>
//           <div className="text-gray-600">Present Today</div>
//         </div>
//         <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
//           <div className="text-2xl font-bold text-yellow-600">{lateToday}</div>
//           <div className="text-gray-600">Late Today</div>
//         </div>
//         <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
//           <div className="text-2xl font-bold text-blue-600">{onLeaveToday}</div>
//           <div className="text-gray-600">On Leave</div>
//         </div>
//         <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
//           <div className="text-2xl font-bold text-purple-600">{totalOvertimeThisMonth.toFixed(1)}h</div>
//           <div className="text-gray-600">Overtime This Month</div>
//         </div>
//       </div>

//       {/* Attendance View */}
//       {view === 'attendance' && (
//         <div className="space-y-6">
//           <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//             <h3 className="text-lg font-semibold mb-4">Today's Attendance ({new Date().toLocaleDateString()})</h3>
//             <div className="space-y-4">
//               {staff.map((member) => {
//                 const todayRecord = attendance.find(a => 
//                   a.staffId === member.id && 
//                   a.date.toDateString() === new Date().toDateString()
//                 );

//                 const isScheduledToday = isStaffScheduledToday(member);
                
//                 return (
//                   <div key={member.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
//                     <div className="flex items-center space-x-4">
//                       <div className={`w-3 h-3 rounded-full ${
//                         todayRecord?.checkIn && !todayRecord.checkOut ? 'bg-green-500' :
//                         todayRecord?.checkOut ? 'bg-gray-400' :
//                         isScheduledToday ? 'bg-yellow-500' : 'bg-red-500'
//                       }`}></div>
//                       <div>
//                         <div className="font-medium text-[#383a3c]">{member.name}</div>
//                         <div className="text-gray-500 text-sm capitalize">{member.role} • {member.department}</div>
//                         {member.schedule && (
//                           <div className="text-gray-400 text-xs">
//                             Schedule: {Object.entries(member.schedule)
//                               .filter(([_, day]) => day.working)
//                               .map(([day, _]) => day.slice(0, 3))
//                               .join(', ')}
//                           </div>
//                         )}
//                       </div>
//                     </div>
                    
//                     <div className="text-right">
//                       <div className="text-sm text-gray-600">
//                         {todayRecord?.checkIn ? `In: ${todayRecord.checkIn.toLocaleTimeString()}` : 
//                          isScheduledToday ? 'Scheduled' : 'Off today'}
//                       </div>
//                       <div className="text-sm text-gray-600">
//                         {todayRecord?.checkOut ? `Out: ${todayRecord.checkOut.toLocaleTimeString()}` : ''}
//                       </div>
//                       {todayRecord?.hoursWorked && (
//                         <div className="text-sm font-medium text-green-600">
//                           {todayRecord.hoursWorked.toFixed(1)} hours
//                           {todayRecord.lateMinutes && todayRecord.lateMinutes > 0 && (
//                             <span className="text-red-600 ml-2">({todayRecord.lateMinutes}m late)</span>
//                           )}
//                         </div>
//                       )}
//                     </div>
                    
//                     <div className="space-x-2">
//                       {!todayRecord && isScheduledToday && (
//                         <button
//                           onClick={() => manualCheckIn(member.id)}
//                           className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-600 cursor-pointer"
//                         >
//                           Check In
//                         </button>
//                       )}
//                       {todayRecord?.checkIn && !todayRecord.checkOut && (
//                         <>
//                           <button
//                             onClick={() => manualCheckOut(member.id)}
//                             className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-600 cursor-pointer"
//                           >
//                             Check Out
//                           </button>
//                           <button
//                             onClick={() => {
//                               setSelectedStaff(member);
//                               setShowReportModal(true);
//                             }}
//                             className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-600 cursor-pointer"
//                           >
//                             Submit Report
//                           </button>
//                         </>
//                       )}
//                       {todayRecord?.checkOut && (
//                         <button
//                           onClick={() => {
//                             setSelectedStaff(member);
//                             setShowReportModal(true);
//                           }}
//                           className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-600 cursor-pointer"
//                         >
//                           View Report
//                         </button>
//                       )}
//                     </div>
//                   </div>
//                 );
//               })}
//             </div>
//           </div>

//           {/* Attendance History */}
//           <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//             <h3 className="text-lg font-semibold mb-4">Recent Attendance</h3>
//             <div className="overflow-x-auto">
//               <table className="w-full">
//                 <thead className="bg-gray-50">
//                   <tr>
//                     <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Staff</th>
//                     <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
//                     <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Check In</th>
//                     <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Check Out</th>
//                     <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Hours</th>
//                     <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-gray-200">
//                   {attendance.slice(0, 10).map((record) => {
//                     const staffMember = staff.find(s => s.id === record.staffId);
//                     return (
//                       <tr key={record.id}>
//                         <td className="px-4 py-2 text-sm text-gray-900">{staffMember?.name}</td>
//                         <td className="px-4 py-2 text-sm text-gray-900">{record.date.toLocaleDateString()}</td>
//                         <td className="px-4 py-2 text-sm text-gray-900">
//                           {record.checkIn ? record.checkIn.toLocaleTimeString() : '-'}
//                         </td>
//                         <td className="px-4 py-2 text-sm text-gray-900">
//                           {record.checkOut ? record.checkOut.toLocaleTimeString() : '-'}
//                         </td>
//                         <td className="px-4 py-2 text-sm text-gray-900">
//                           {record.hoursWorked ? record.hoursWorked.toFixed(1) : '-'}
//                         </td>
//                         <td className="px-4 py-2">
//                           <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
//                             record.status === 'present' ? 'bg-green-100 text-green-800' :
//                             record.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
//                             record.status === 'absent' ? 'bg-red-100 text-red-800' :
//                             'bg-gray-100 text-gray-800'
//                           }`}>
//                             {record.status}
//                           </span>
//                         </td>
//                       </tr>
//                     );
//                   })}
//                 </tbody>
//               </table>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Schedule View */}
//       {view === 'schedule' && (
//         <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//           <h3 className="text-lg font-semibold mb-4">Staff Schedules</h3>
//           <div className="overflow-x-auto">
//             <table className="w-full">
//               <thead className="bg-gray-50">
//                 <tr>
//                   <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Staff</th>
//                   <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
//                   {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
//                     <th key={day} className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
//                       {day}
//                     </th>
//                   ))}
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-gray-200">
//                 {staff.map((member) => (
//                   <tr key={member.id}>
//                     <td className="px-4 py-2 text-sm font-medium text-gray-900">{member.name}</td>
//                     <td className="px-4 py-2 text-sm text-gray-500 capitalize">{member.role}</td>
//                     {Object.entries(member.schedule).map(([day, schedule]) => (
//                       <td key={day} className="px-4 py-2 text-center">
//                         {schedule.working ? (
//                           <div className="text-xs text-green-600">
//                             {schedule.start} - {schedule.end}
//                           </div>
//                         ) : (
//                           <div className="text-xs text-gray-400">Off</div>
//                         )}
//                       </td>
//                     ))}
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       )}

//       {/* Reports View */}
//       {view === 'reports' && (
//         <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//           <div className="flex justify-between items-center mb-4">
//             <h3 className="text-lg font-semibold">Daily Reports</h3>
//             <button
//               onClick={() => {
//                 setSelectedStaff(staff[0]); // Default to first staff for demo
//                 setShowReportModal(true);
//               }}
//               className="bg-[#f06123] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-orange-600 cursor-pointer"
//             >
//               + New Report
//             </button>
//           </div>
//           <div className="space-y-4">
//             {dailyReports.map((report) => {
//               const staffMember = staff.find(s => s.id === report.staffId);
//               return (
//                 <div key={report.id} className="border border-gray-200 rounded-lg p-4">
//                   <div className="flex justify-between items-start mb-3">
//                     <div>
//                       <div className="font-medium text-gray-900">{staffMember?.name}</div>
//                       <div className="text-sm text-gray-500">{report.date.toLocaleDateString()}</div>
//                     </div>
//                     <div className="text-sm text-gray-500">
//                       Submitted: {report.submittedAt.toLocaleTimeString()}
//                     </div>
//                   </div>
                  
//                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
//                     <div>
//                       <div className="font-medium text-gray-700 mb-1">Tasks Completed</div>
//                       <ul className="list-disc list-inside text-gray-600">
//                         {report.tasksCompleted.map((task, index) => (
//                           <li key={index}>{task}</li>
//                         ))}
//                       </ul>
//                     </div>
//                     <div>
//                       <div className="font-medium text-gray-700 mb-1">Issues Reported</div>
//                       <ul className="list-disc list-inside text-gray-600">
//                         {report.issuesReported.map((issue, index) => (
//                           <li key={index}>{issue}</li>
//                         ))}
//                       </ul>
//                     </div>
//                     <div>
//                       <div className="font-medium text-gray-700 mb-1">Supplies Used</div>
//                       <ul className="list-disc list-inside text-gray-600">
//                         {report.suppliesUsed.map((supply, index) => (
//                           <li key={index}>{supply}</li>
//                         ))}
//                       </ul>
//                     </div>
//                   </div>

//                   {(report.guestFeedback || report.notes) && (
//                     <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
//                       {report.guestFeedback && (
//                         <div>
//                           <div className="font-medium text-gray-700 mb-1">Guest Feedback</div>
//                           <p className="text-gray-600">{report.guestFeedback}</p>
//                         </div>
//                       )}
//                       {report.notes && (
//                         <div>
//                           <div className="font-medium text-gray-700 mb-1">Additional Notes</div>
//                           <p className="text-gray-600">{report.notes}</p>
//                         </div>
//                       )}
//                     </div>
//                   )}
//                 </div>
//               );
//             })}
//           </div>
//         </div>
//       )}

//       {/* Leave Requests View */}
//       {view === 'leaves' && (
//         <div className="space-y-6">
//           <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//             <div className="flex justify-between items-center mb-4">
//               <h3 className="text-lg font-semibold">Leave Requests</h3>
//               <button
//                 onClick={() => {
//                   setSelectedStaff(staff[0]); // Default to first staff for demo
//                   setShowLeaveModal(true);
//                 }}
//                 className="bg-[#f06123] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-orange-600 cursor-pointer"
//               >
//                 + Request Leave
//               </button>
//             </div>
//             <div className="space-y-4">
//               {leaveRequests.map((request) => {
//                 const staffMember = staff.find(s => s.id === request.staffId);
//                 return (
//                   <div key={request.id} className="border border-gray-200 rounded-lg p-4">
//                     <div className="flex justify-between items-start mb-3">
//                       <div>
//                         <div className="font-medium text-gray-900">{staffMember?.name}</div>
//                         <div className="text-sm text-gray-500 capitalize">{request.type} Leave</div>
//                       </div>
//                       <div className="flex items-center space-x-2">
//                         <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
//                           request.status === 'approved' ? 'bg-green-100 text-green-800' :
//                           request.status === 'rejected' ? 'bg-red-100 text-red-800' :
//                           'bg-yellow-100 text-yellow-800'
//                         }`}>
//                           {request.status}
//                         </span>
//                         {request.status === 'pending' && (
//                           <div className="flex space-x-1">
//                             <button
//                               onClick={() => updateLeaveStatus(request.id, 'approved')}
//                               className="text-green-600 hover:text-green-700 cursor-pointer"
//                             >
//                               Approve
//                             </button>
//                             <button
//                               onClick={() => updateLeaveStatus(request.id, 'rejected')}
//                               className="text-red-600 hover:text-red-700 cursor-pointer"
//                             >
//                               Reject
//                             </button>
//                           </div>
//                         )}
//                       </div>
//                     </div>
                    
//                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
//                       <div>
//                         <div className="font-medium text-gray-700">Dates</div>
//                         <div className="text-gray-600">
//                           {request.startDate.toLocaleDateString()} - {request.endDate.toLocaleDateString()}
//                         </div>
//                       </div>
//                       <div>
//                         <div className="font-medium text-gray-700">Reason</div>
//                         <div className="text-gray-600">{request.reason}</div>
//                       </div>
//                       <div>
//                         <div className="font-medium text-gray-700">Submitted</div>
//                         <div className="text-gray-600">{request.submittedAt.toLocaleDateString()}</div>
//                       </div>
//                     </div>
//                   </div>
//                 );
//               })}
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Add Staff Modal */}
//       {showAddStaff && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//           <div className="bg-white rounded-2xl p-6 w-full max-w-md">
//             <h3 className="text-xl font-bold mb-4">Add Staff Member</h3>
//             <div className="space-y-4">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
//                 <input
//                   type="text"
//                   value={newStaff.name}
//                   onChange={(e) => setNewStaff({...newStaff, name: e.target.value})}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
//                 <select
//                   value={newStaff.role}
//                   onChange={(e) => setNewStaff({...newStaff, role: e.target.value as any})}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] cursor-pointer"
//                 >
//                   <option value="cleaner">Cleaner</option>
//                   <option value="maintenance">Maintenance</option>
//                   <option value="concierge">Concierge</option>
//                   <option value="manager">Manager</option>
//                   <option value="supervisor">Supervisor</option>
//                 </select>
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
//                 <input
//                   type="text"
//                   value={newStaff.department}
//                   onChange={(e) => setNewStaff({...newStaff, department: e.target.value})}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
//                 <input
//                   type="email"
//                   value={newStaff.email}
//                   onChange={(e) => setNewStaff({...newStaff, email: e.target.value})}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
//                 <input
//                   type="text"
//                   value={newStaff.phone}
//                   onChange={(e) => setNewStaff({...newStaff, phone: e.target.value})}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Salary ($)</label>
//                 <input
//                   type="number"
//                   value={newStaff.salary}
//                   onChange={(e) => setNewStaff({...newStaff, salary: parseFloat(e.target.value) || 0})}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
//                 />
//               </div>
//               <div className="flex space-x-3 pt-4">
//                 <button
//                   onClick={() => setShowAddStaff(false)}
//                   className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 cursor-pointer"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={addStaffMember}
//                   className="flex-1 px-4 py-2 bg-[#f06123] text-white rounded-lg font-semibold hover:bg-orange-600 cursor-pointer"
//                 >
//                   Add Staff
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Daily Report Modal */}
//       {showReportModal && selectedStaff && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//           <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
//             <div className="flex justify-between items-center mb-6">
//               <h3 className="text-xl font-bold">Daily Work Report - {selectedStaff.name}</h3>
//               <button
//                 onClick={() => setShowReportModal(false)}
//                 className="text-gray-400 hover:text-gray-600 cursor-pointer"
//               >
//                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
//                 </svg>
//               </button>
//             </div>

//             <div className="space-y-6">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">Tasks Completed Today</label>
//                 {dailyReport.tasksCompleted.map((task, index) => (
//                   <div key={index} className="flex space-x-2 mb-2">
//                     <input
//                       type="text"
//                       value={task}
//                       onChange={(e) => {
//                         const newTasks = [...dailyReport.tasksCompleted];
//                         newTasks[index] = e.target.value;
//                         setDailyReport({...dailyReport, tasksCompleted: newTasks});
//                       }}
//                       className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
//                       placeholder="Describe completed task..."
//                     />
//                     {index === dailyReport.tasksCompleted.length - 1 && (
//                       <button
//                         onClick={() => setDailyReport({
//                           ...dailyReport,
//                           tasksCompleted: [...dailyReport.tasksCompleted, '']
//                         })}
//                         className="bg-gray-200 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-300 cursor-pointer"
//                       >
//                         +
//                       </button>
//                     )}
//                   </div>
//                 ))}
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">Issues Encountered</label>
//                 {dailyReport.issuesReported.map((issue, index) => (
//                   <div key={index} className="flex space-x-2 mb-2">
//                     <input
//                       type="text"
//                       value={issue}
//                       onChange={(e) => {
//                         const newIssues = [...dailyReport.issuesReported];
//                         newIssues[index] = e.target.value;
//                         setDailyReport({...dailyReport, issuesReported: newIssues});
//                       }}
//                       className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
//                       placeholder="Describe any issues..."
//                     />
//                     {index === dailyReport.issuesReported.length - 1 && (
//                       <button
//                         onClick={() => setDailyReport({
//                           ...dailyReport,
//                           issuesReported: [...dailyReport.issuesReported, '']
//                         })}
//                         className="bg-gray-200 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-300 cursor-pointer"
//                       >
//                         +
//                       </button>
//                     )}
//                   </div>
//                 ))}
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">Supplies Used</label>
//                 {dailyReport.suppliesUsed.map((supply, index) => (
//                   <div key={index} className="flex space-x-2 mb-2">
//                     <input
//                       type="text"
//                       value={supply}
//                       onChange={(e) => {
//                         const newSupplies = [...dailyReport.suppliesUsed];
//                         newSupplies[index] = e.target.value;
//                         setDailyReport({...dailyReport, suppliesUsed: newSupplies});
//                       }}
//                       className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
//                       placeholder="List supplies used..."
//                     />
//                     {index === dailyReport.suppliesUsed.length - 1 && (
//                       <button
//                         onClick={() => setDailyReport({
//                           ...dailyReport,
//                           suppliesUsed: [...dailyReport.suppliesUsed, '']
//                         })}
//                         className="bg-gray-200 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-300 cursor-pointer"
//                       >
//                         +
//                       </button>
//                     )}
//                   </div>
//                 ))}
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">Guest Feedback</label>
//                 <textarea
//                   value={dailyReport.guestFeedback}
//                   onChange={(e) => setDailyReport({...dailyReport, guestFeedback: e.target.value})}
//                   rows={3}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
//                   placeholder="Any guest feedback received..."
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes</label>
//                 <textarea
//                   value={dailyReport.notes}
//                   onChange={(e) => setDailyReport({...dailyReport, notes: e.target.value})}
//                   rows={3}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
//                   placeholder="Any additional notes or comments..."
//                 />
//               </div>

//               <div className="flex space-x-3 pt-4">
//                 <button
//                   onClick={() => setShowReportModal(false)}
//                   className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 cursor-pointer"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={submitDailyReport}
//                   className="flex-1 px-4 py-2 bg-[#f06123] text-white rounded-lg font-semibold hover:bg-orange-600 cursor-pointer"
//                 >
//                   Submit Report
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Leave Request Modal */}
//       {showLeaveModal && selectedStaff && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//           <div className="bg-white rounded-2xl p-6 w-full max-w-md">
//             <h3 className="text-xl font-bold mb-4">Request Leave - {selectedStaff.name}</h3>
//             <div className="space-y-4">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type</label>
//                 <select
//                   value={leaveRequest.type}
//                   onChange={(e) => setLeaveRequest({...leaveRequest, type: e.target.value as any})}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123] cursor-pointer"
//                 >
//                   <option value="vacation">Vacation</option>
//                   <option value="sick">Sick Leave</option>
//                   <option value="personal">Personal</option>
//                   <option value="emergency">Emergency</option>
//                 </select>
//               </div>
//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
//                   <input
//                     type="date"
//                     value={leaveRequest.startDate.toISOString().split('T')[0]}
//                     onChange={(e) => setLeaveRequest({...leaveRequest, startDate: new Date(e.target.value)})}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
//                   <input
//                     type="date"
//                     value={leaveRequest.endDate.toISOString().split('T')[0]}
//                     onChange={(e) => setLeaveRequest({...leaveRequest, endDate: new Date(e.target.value)})}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
//                   />
//                 </div>
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
//                 <textarea
//                   value={leaveRequest.reason}
//                   onChange={(e) => setLeaveRequest({...leaveRequest, reason: e.target.value})}
//                   rows={3}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f06123]"
//                   placeholder="Reason for leave request..."
//                 />
//               </div>
//               <div className="flex space-x-3 pt-4">
//                 <button
//                   onClick={() => setShowLeaveModal(false)}
//                   className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 cursor-pointer"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={submitLeaveRequest}
//                   className="flex-1 px-4 py-2 bg-[#f06123] text-white rounded-lg font-semibold hover:bg-orange-600 cursor-pointer"
//                 >
//                   Submit Request
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }







































































// // // components/admin/operational/StaffScheduler.tsx
// // 'use client';

// // import { useState, useEffect } from 'react';

// // interface StaffMember {
// //   id: string;
// //   name: string;
// //   role: 'cleaner' | 'maintenance' | 'manager' | 'concierge';
// //   email: string;
// //   phone: string;
// //   status: 'active' | 'inactive';
// // }

// // interface AttendanceRecord {
// //   id: string;
// //   staffId: string;
// //   date: Date;
// //   checkIn?: Date;
// //   checkOut?: Date;
// //   status: 'present' | 'absent' | 'late' | 'leave';
// //   hoursWorked?: number;
// // }

// // export default function StaffScheduler() {
// //   const [staff, setStaff] = useState<StaffMember[]>([]);
// //   const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
// //   const [currentTime, setCurrentTime] = useState(new Date());

// //   useEffect(() => {
// //     const timer = setInterval(() => {
// //       setCurrentTime(new Date());
// //     }, 1000);
// //     return () => clearInterval(timer);
// //   }, []);

// //   const autoCheckIn = (staffId: string) => {
// //     // Auto-detect check-in based on location/device (simulated)
// //     const record: AttendanceRecord = {
// //       id: `ATT-${Date.now()}`,
// //       staffId,
// //       date: new Date(),
// //       checkIn: new Date(),
// //       status: 'present'
// //     };
// //     setAttendance([...attendance, record]);
// //   };

// //   const autoCheckOut = (staffId: string) => {
// //     // Auto-detect check-out
// //     setAttendance(attendance.map(record => 
// //       record.staffId === staffId && !record.checkOut
// //         ? { 
// //             ...record, 
// //             checkOut: new Date(),
// //             hoursWorked: calculateHoursWorked(record.checkIn!, new Date())
// //           }
// //         : record
// //     ));
// //   };

// //   const calculateHoursWorked = (checkIn: Date, checkOut: Date) => {
// //     return (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
// //   };

// //   return (
// //     <div className="space-y-6">
// //       <div className="flex justify-between items-center">
// //         <div>
// //           <h2 className="text-2xl font-bold text-[#383a3c]">Staff Scheduling</h2>
// //           <p className="text-gray-600">Current time: {currentTime.toLocaleString()}</p>
// //         </div>
// //         <button className="bg-[#f06123] text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition duration-200">
// //           + Add Staff
// //         </button>
// //       </div>

// //       {/* Real-time attendance tracking */}
// //       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
// //         <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
// //           <div className="text-2xl font-bold text-green-600">
// //             {attendance.filter(a => a.status === 'present').length}
// //           </div>
// //           <div className="text-gray-600">Currently Working</div>
// //         </div>
// //         <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
// //           <div className="text-2xl font-bold text-red-600">
// //             {attendance.filter(a => a.status === 'absent').length}
// //           </div>
// //           <div className="text-gray-600">Absent Today</div>
// //         </div>
// //         <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
// //           <div className="text-2xl font-bold text-blue-600">
// //             {attendance.filter(a => a.checkIn && !a.checkOut).length}
// //           </div>
// //           <div className="text-gray-600">Checked In</div>
// //         </div>
// //       </div>

// //       {/* Staff list with auto-attendance tracking */}
// //       <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
// //         <h3 className="text-lg font-semibold mb-4">Today's Attendance</h3>
// //         <div className="space-y-4">
// //           {staff.map((member) => {
// //             const todayRecord = attendance.find(a => 
// //               a.staffId === member.id && 
// //               a.date.toDateString() === new Date().toDateString()
// //             );
            
// //             return (
// //               <div key={member.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
// //                 <div>
// //                   <div className="font-medium text-[#383a3c]">{member.name}</div>
// //                   <div className="text-gray-500 text-sm capitalize">{member.role}</div>
// //                 </div>
// //                 <div className="text-right">
// //                   <div className="text-sm text-gray-600">
// //                     {todayRecord?.checkIn ? `In: ${todayRecord.checkIn.toLocaleTimeString()}` : 'Not checked in'}
// //                   </div>
// //                   <div className="text-sm text-gray-600">
// //                     {todayRecord?.checkOut ? `Out: ${todayRecord.checkOut.toLocaleTimeString()}` : ''}
// //                   </div>
// //                   {todayRecord?.hoursWorked && (
// //                     <div className="text-sm font-medium text-green-600">
// //                       {todayRecord.hoursWorked.toFixed(1)} hours
// //                     </div>
// //                   )}
// //                 </div>
// //                 <div className="space-x-2">
// //                   {!todayRecord && (
// //                     <button
// //                       onClick={() => autoCheckIn(member.id)}
// //                       className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-600"
// //                     >
// //                       Check In
// //                     </button>
// //                   )}
// //                   {todayRecord?.checkIn && !todayRecord.checkOut && (
// //                     <button
// //                       onClick={() => autoCheckOut(member.id)}
// //                       className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-600"
// //                     >
// //                       Check Out
// //                     </button>
// //                   )}
// //                 </div>
// //               </div>
// //             );
// //           })}
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }


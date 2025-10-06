import React, { useState } from 'react';
import { Users, Calendar, Wrench, TrendingUp, Activity, DollarSign } from 'lucide-react';

const AdminDashboard = () => {
  const [stats] = useState({
    totalClients: 247,
    activeBookings: 45,
    monthlyRevenue: 125000,
    satisfactionRate: 98
  });

  const recentBookings = [
    { id: 1, client: 'John Smith', service: 'Elder Care', date: '2024-01-15', status: 'Confirmed' },
    { id: 2, client: 'Mary Johnson', service: 'Home Repair', date: '2024-01-16', status: 'Pending' },
    { id: 3, client: 'Robert Davis', service: 'Home Care', date: '2024-01-17', status: 'Confirmed' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <Users className="w-10 h-10 text-blue-600" />
              <span className="text-sm text-gray-600">Total Clients</span>
            </div>
            <div className="text-3xl font-bold">{stats.totalClients}</div>
          </div>
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <Calendar className="w-10 h-10 text-purple-600" />
              <span className="text-sm text-gray-600">Active Bookings</span>
            </div>
            <div className="text-3xl font-bold">{stats.activeBookings}</div>
          </div>
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="w-10 h-10 text-green-600" />
              <span className="text-sm text-gray-600">Monthly Revenue</span>
            </div>
            <div className="text-3xl font-bold">${(stats.monthlyRevenue / 1000).toFixed(0)}K</div>
          </div>
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="w-10 h-10 text-orange-600" />
              <span className="text-sm text-gray-600">Satisfaction</span>
            </div>
            <div className="text-3xl font-bold">{stats.satisfactionRate}%</div>
          </div>
        </div>

        <div className="card p-8">
          <h2 className="text-2xl font-bold mb-6">Recent Bookings</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Client</th>
                  <th className="text-left py-3 px-4">Service</th>
                  <th className="text-left py-3 px-4">Date</th>
                  <th className="text-left py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map(booking => (
                  <tr key={booking.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{booking.client}</td>
                    <td className="py-3 px-4">{booking.service}</td>
                    <td className="py-3 px-4">{booking.date}</td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-sm ${booking.status === 'Confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {booking.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

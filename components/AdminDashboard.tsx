import React from 'react';
import { Card } from './ui/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const data = [
  { name: 'Mon', generations: 12, cost: 4.5 },
  { name: 'Tue', generations: 19, cost: 8.2 },
  { name: 'Wed', generations: 3, cost: 1.1 },
  { name: 'Thu', generations: 25, cost: 12.5 },
  { name: 'Fri', generations: 42, cost: 18.0 },
  { name: 'Sat', generations: 30, cost: 14.2 },
  { name: 'Sun', generations: 15, cost: 6.8 },
];

export const AdminDashboard: React.FC = () => {
  return (
    <div className="p-8 space-y-6 h-full overflow-y-auto">
      <h1 className="text-3xl font-bold text-white mb-8">Admin Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Total Generations" className="border-l-4 border-l-indigo-500">
          <p className="text-4xl font-bold text-white">146</p>
          <p className="text-green-400 text-sm mt-2">+12% from last week</p>
        </Card>
        <Card title="Est. API Cost" className="border-l-4 border-l-pink-500">
          <p className="text-4xl font-bold text-white">$65.30</p>
          <p className="text-slate-400 text-sm mt-2">Based on token usage</p>
        </Card>
        <Card title="Active Users" className="border-l-4 border-l-cyan-500">
          <p className="text-4xl font-bold text-white">32</p>
          <p className="text-slate-400 text-sm mt-2">Currently online</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-96">
        <Card title="Generation Activity">
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }}
                itemStyle={{ color: '#818cf8' }}
              />
              <Bar dataKey="generations" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Token Consumption Trend">
          <ResponsiveContainer width="100%" height="85%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip 
                 contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }}
              />
              <Line type="monotone" dataKey="cost" stroke="#ec4899" strokeWidth={2} dot={{r: 4}} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
};
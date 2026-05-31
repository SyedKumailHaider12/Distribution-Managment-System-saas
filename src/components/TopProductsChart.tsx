import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { fetchTopProducts } from '@/lib/api';

interface ProductData {
  name: string;
  quantity: number;
}

export const TopProductsChart: React.FC = () => {
  const [data, setData] = useState<ProductData[]>([]);

  useEffect(() => {
    fetchTopProducts().then(setData).catch(console.error);
  }, []);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" stroke="#A0A0A0" />
        <YAxis stroke="#A0A0A0" />
        <Tooltip />
        <Bar dataKey="quantity" fill="#4CAF50" />
      </BarChart>
    </ResponsiveContainer>
  );
};

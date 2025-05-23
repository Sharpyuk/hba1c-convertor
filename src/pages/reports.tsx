import React, { useState, useEffect } from 'react';
import StatisticsWidget from '../components/StatisticsWidget';
import AGPGraph from '../components/AGPGraph';
import PercentileWidget from '../components/PercentileWidget';
import CarbsChart from '../components/CarbsChart';
import Layout from '../components/Layout';
import { SpeedInsights } from "@vercel/speed-insights/next"

const Reports: React.FC = () => {
  const [range, setRange] = useState<string>('today');
  const [loading, setLoading] = useState<boolean>(false);
  const [graphData, setGraphData] = useState<any[]>([]);
  const [carbsData, setCarbsData] = useState<{ time: string; carbs: number }[]>([]);

  useEffect(() => {
    // Fetch carbs data based on the selected range
    const fetchCarbsData = async () => {
      // Simulated API call to fetch carbs data
      const response = await fetch(`/api/carbs?range=${range}`);
      const data = await response.json();
      setCarbsData(data);
    };

    fetchCarbsData();
  }, [range]);

  const fetchGraphData = async (range: string) => {
    try {
      setLoading(true);
      const now = new Date();
      let startDate = new Date();

      if (range === 'today') {
        startDate.setUTCHours(0, 0, 0, 0);
        now.setUTCHours(23, 59, 59, 999);
      } else if (range === 'yesterday') {
        startDate.setUTCDate(now.getUTCDate() - 1);
        startDate.setUTCHours(0, 0, 0, 0);
        now.setUTCDate(now.getUTCDate() - 1);
        now.setUTCHours(23, 59, 59, 999);
      } else if (range === '1w') {
        startDate.setUTCDate(now.getUTCDate() - 7);
      } else if (range === '1m') {
        startDate.setUTCMonth(now.getUTCMonth() - 1);
      } else if (range === '3m') {
        startDate.setUTCMonth(now.getUTCMonth() - 3);
      }

      const query = `find[dateString][$gte]=${startDate.toISOString()}&find[dateString][$lte]=${now.toISOString()}`;
      const response = await fetch(
        `https://sharpy-cgm.up.railway.app/api/v1/entries.json?${query}&count=10000`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch graph data: ${response.status}`);
      }

      const data = await response.json();
      setGraphData(data.reverse());
    } catch (error) {
      console.error('Error fetching graph data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGraphData(range);
  }, [range]);

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 pt-20 sm:px-6 lg:px-8">
        {/* StatisticsWidget */}
        <div className="mb-6 w-full max-w-screen-sm mx-auto">
          <StatisticsWidget range={range} setRange={setRange} loading={loading} setLoading={setLoading} />
        </div>

        {/* AGPGraph */}
        <div className="mb-6 w-full max-w-screen-sm mx-auto">
          <AGPGraph range={range} graphData={graphData} />
        </div>

        {/* CarbsChart */}
        <div className="mb-6 w-full max-w-screen-sm mx-auto">
          <CarbsChart range={range} carbsData={carbsData} />
        </div>
      </div>
    </Layout>
  );
};

export default Reports;
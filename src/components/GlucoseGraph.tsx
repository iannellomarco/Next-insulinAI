'use client';

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, ReferenceArea, ReferenceLine } from 'recharts';
import { GlucoseReading } from '@/app/actions/libre';
import { format } from 'date-fns';

interface GlucoseGraphProps {
    data: GlucoseReading[];
    mealTime?: Date;
    height?: number;
}

export default function GlucoseGraph({ data, mealTime, height = 200 }: GlucoseGraphProps) {
    if (!data || data.length === 0) {
        return (
            <div style={{ height: height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', fontSize: '13px' }}>
                No glucose data available for this period
            </div>
        );
    }

    // Prepare data for chart
    const chartData = data.map(reading => ({
        ...reading,
        timeStr: format(new Date(reading.timestamp), 'HH:mm'),
        timestamp: new Date(reading.timestamp).getTime()
    })).sort((a, b) => a.timestamp - b.timestamp);

    // Calculate dynamic Y-axis domain padding
    const minVal = Math.min(...chartData.map(d => d.value));
    const maxVal = Math.max(...chartData.map(d => d.value));
    const yDomain = [Math.max(0, minVal - 20), maxVal + 20];

    return (
        <div style={{ width: '100%', height: height, marginTop: '8px' }}>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                    <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0066cc" stopOpacity={0.1} />
                            <stop offset="95%" stopColor="#0066cc" stopOpacity={0} />
                        </linearGradient>
                    </defs>

                    {/* Target Range (70-180 typically) - Greenish background area */}
                    <ReferenceArea y1={70} y2={180} fill="#ecfdf5" fillOpacity={0.5} />

                    {/* Meal Time Marker */}
                    {mealTime && (
                        <ReferenceLine
                            x={mealTime.getTime()}
                            stroke="#ef4444"
                            strokeDasharray="3 3"
                            label={{ position: 'top', value: 'Meal', fill: '#ef4444', fontSize: 10 }}
                        />
                    )}

                    <XAxis
                        dataKey="timestamp"
                        type="number"
                        domain={['dataMin', 'dataMax']}
                        stroke="#9ca3af"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(unix) => format(new Date(unix), 'HH:mm')}
                        ticks={chartData.length > 0 ? [
                            chartData[0].timestamp,
                            chartData[Math.floor(chartData.length / 2)].timestamp,
                            chartData[chartData.length - 1].timestamp
                        ] : []}
                    />
                    <YAxis
                        domain={yDomain}
                        stroke="#9ca3af"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        width={30}
                    />
                    <Tooltip
                        labelFormatter={(unix) => format(new Date(unix), 'HH:mm')}
                        contentStyle={{
                            borderRadius: '8px',
                            border: 'none',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            fontSize: '12px'
                        }}
                    />
                    <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#0066cc"
                        strokeWidth={2}
                        dot={chartData.length < 10} // Show dots for few points
                        activeDot={{ r: 4 }}
                        isAnimationActive={false}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

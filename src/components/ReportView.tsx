'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, Activity, Droplet, Utensils, BarChart3 } from 'lucide-react';
import { useStore } from '@/lib/store';
import { calculateReportData } from '@/lib/utils';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ReportData {
    summary: {
        avgPreGlucose: number;
        avgPostGlucose: number;
        totalInsulin: number;
        totalCarbs: number;
        count: number;
    };
    dailyStats: {
        date: string;
        avgGlucose: number;
        totalInsulin: number;
    }[];
}

export default function ReportView({ onBack }: { onBack: () => void }) {
    const { history } = useStore();
    const [days, setDays] = useState(7);
    const [data, setData] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData(days);
    }, [days, history]);

    const loadData = async (d: number) => {
        setLoading(true);
        const result = calculateReportData(history, d);
        if (result && result.summary) {
            setData(result as ReportData);
        }
        setLoading(false);
    };

    return (
        <section className="view report-view" id="report-view">
            <div className="view-header">
                <button 
                    className="icon-btn" 
                    onClick={onBack}
                    aria-label="Go back"
                >
                    <ArrowLeft size={22} />
                </button>
                <h2>Insights</h2>
                <div style={{ width: 40 }} />
            </div>

            <div className="report-controls">
                <div className="segmented-control" role="tablist">
                    {[7, 30, 90].map((d) => (
                        <button
                            key={d}
                            role="tab"
                            aria-selected={days === d}
                            className={days === d ? 'active' : ''}
                            onClick={() => setDays(d)}
                        >
                            {d}d
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="loading-state">
                    <div className="spinner" />
                    <span>Loading insights...</span>
                </div>
            ) : data && data.summary.count > 0 ? (
                <div className="report-content">
                    {/* Summary Stats */}
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-icon b-blue">
                                <Activity size={18} />
                            </div>
                            <span className="stat-value">{data.summary.avgPreGlucose || '-'}</span>
                            <span className="stat-label">Avg Pre-Meal</span>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon b-green">
                                <TrendingUp size={18} />
                            </div>
                            <span className="stat-value">{data.summary.avgPostGlucose || '-'}</span>
                            <span className="stat-label">Avg Post-Meal</span>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon b-teal">
                                <Droplet size={18} />
                            </div>
                            <span className="stat-value">{data.summary.totalInsulin}</span>
                            <span className="stat-label">Total Insulin</span>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon b-orange">
                                <Utensils size={18} />
                            </div>
                            <span className="stat-value">{data.summary.totalCarbs}g</span>
                            <span className="stat-label">Total Carbs</span>
                        </div>
                    </div>

                    {/* Glucose Chart */}
                    {data.dailyStats.length > 0 && (
                        <div className="chart-card">
                            <h3>Glucose Trend</h3>
                            <div className="chart-wrapper">
                                <ResponsiveContainer width="100%" height={180}>
                                    <AreaChart data={data.dailyStats}>
                                        <defs>
                                            <linearGradient id="colorGlucose" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid 
                                            strokeDasharray="3 3" 
                                            stroke="var(--border)" 
                                            vertical={false} 
                                        />
                                        <XAxis
                                            dataKey="date"
                                            axisLine={false}
                                            tickLine={false}
                                            fontSize={11}
                                            tickMargin={8}
                                            minTickGap={30}
                                            stroke="var(--muted-foreground)"
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            fontSize={11}
                                            width={32}
                                            stroke="var(--muted-foreground)"
                                        />
                                        <Tooltip
                                            contentStyle={{ 
                                                backgroundColor: 'var(--card)', 
                                                borderRadius: '12px', 
                                                border: '1px solid var(--border)',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                                fontSize: '13px'
                                            }}
                                            labelStyle={{ color: 'var(--muted-foreground)' }}
                                            itemStyle={{ color: 'var(--foreground)' }}
                                        />
                                        <Area 
                                            type="monotone" 
                                            dataKey="avgGlucose" 
                                            stroke="#14b8a6" 
                                            strokeWidth={2} 
                                            fillOpacity={1} 
                                            fill="url(#colorGlucose)" 
                                            name="Avg Glucose" 
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* Insulin Chart */}
                    {data.dailyStats.length > 0 && (
                        <div className="chart-card">
                            <h3>Insulin Usage</h3>
                            <div className="chart-wrapper">
                                <ResponsiveContainer width="100%" height={180}>
                                    <AreaChart data={data.dailyStats}>
                                        <defs>
                                            <linearGradient id="colorInsulin" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#0891b2" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#0891b2" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid 
                                            strokeDasharray="3 3" 
                                            stroke="var(--border)" 
                                            vertical={false} 
                                        />
                                        <XAxis
                                            dataKey="date"
                                            axisLine={false}
                                            tickLine={false}
                                            fontSize={11}
                                            tickMargin={8}
                                            minTickGap={30}
                                            stroke="var(--muted-foreground)"
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            fontSize={11}
                                            width={32}
                                            stroke="var(--muted-foreground)"
                                        />
                                        <Tooltip
                                            contentStyle={{ 
                                                backgroundColor: 'var(--card)', 
                                                borderRadius: '12px', 
                                                border: '1px solid var(--border)',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                                fontSize: '13px'
                                            }}
                                            labelStyle={{ color: 'var(--muted-foreground)' }}
                                            itemStyle={{ color: 'var(--foreground)' }}
                                        />
                                        <Area 
                                            type="stepAfter" 
                                            dataKey="totalInsulin" 
                                            stroke="#0891b2" 
                                            strokeWidth={2} 
                                            fillOpacity={1} 
                                            fill="url(#colorInsulin)" 
                                            name="Total Insulin" 
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* Meals Count */}
                    <div className="meals-summary">
                        <BarChart3 size={16} />
                        <span>{data.summary.count} meals logged in the last {days} days</span>
                    </div>
                </div>
            ) : (
                <div className="empty-state-centered">
                    <div className="empty-icon">
                        <BarChart3 size={32} strokeWidth={1.5} />
                    </div>
                    <h3>No data yet</h3>
                    <p>Start logging meals to see your insights</p>
                </div>
            )}
        </section>
    );
}

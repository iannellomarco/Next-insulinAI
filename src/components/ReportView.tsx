'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, Activity, Droplet, Utensils } from 'lucide-react';
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
        // Use client-side calculation to support Guest/Offline mode
        // The store handles syncing with the server if logged in
        const result = calculateReportData(history, d);
        if (result && result.summary) {
            setData(result as ReportData);
        }
        setLoading(false);
    };

    return (
        <section className="view" id="report-view">
            <div className="view-header">
                <button className="icon-btn" onClick={onBack}>
                    <ArrowLeft size={24} />
                </button>
                <h2>Report</h2>
                <div style={{ width: 40 }} /> {/* Spacer */}
            </div>

            <div className="report-controls">
                <div className="segmented-control">
                    {[7, 30, 90].map((d) => (
                        <button
                            key={d}
                            className={days === d ? 'active' : ''}
                            onClick={() => setDays(d)}
                        >
                            {d} Days
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="loading-spinner">Loading data...</div>
            ) : data ? (
                <div className="report-content">
                    {/* Summary Cards */}
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-icon b-blue"><Activity size={20} /></div>
                            <div className="stat-value">{data.summary.avgPreGlucose}</div>
                            <div className="stat-label">Avg Pre Glucose</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon b-green"><TrendingUp size={20} /></div>
                            <div className="stat-value">{data.summary.avgPostGlucose}</div>
                            <div className="stat-label">Avg Post Glucose</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon b-purple"><Droplet size={20} /></div>
                            <div className="stat-value">{data.summary.totalInsulin}</div>
                            <div className="stat-label">Total Insulin</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon b-orange"><Utensils size={20} /></div>
                            <div className="stat-value">{data.summary.totalCarbs}</div>
                            <div className="stat-label">Total Carbs</div>
                        </div>
                    </div>

                    {/* Chart 1: Glucose */}
                    <div className="chart-container">
                        <h3>Glucose Trend</h3>
                        <div style={{ width: '100%', height: 200 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data.dailyStats}>
                                    <defs>
                                        <linearGradient id="colorGlucose" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#818cf8" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        axisLine={false}
                                        tickLine={false}
                                        fontSize={10}
                                        tickMargin={10}
                                        minTickGap={30}
                                        stroke="var(--text-secondary)"
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        fontSize={10}
                                        width={30}
                                        stroke="var(--text-secondary)"
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'var(--card-bg)', borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                        labelStyle={{ color: 'var(--text-secondary)' }}
                                        itemStyle={{ color: 'var(--text-color)' }}
                                    />
                                    <Area type="monotone" dataKey="avgGlucose" stroke="#818cf8" strokeWidth={2} fillOpacity={1} fill="url(#colorGlucose)" name="Avg Glucose" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Chart 2: Insulin */}
                    <div className="chart-container" style={{ marginTop: '20px' }}>
                        <h3>Insulin Usage</h3>
                        <div style={{ width: '100%', height: 200 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data.dailyStats}>
                                    <defs>
                                        <linearGradient id="colorInsulin" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#c084fc" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#c084fc" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        axisLine={false}
                                        tickLine={false}
                                        fontSize={10}
                                        tickMargin={10}
                                        minTickGap={30}
                                        stroke="var(--text-secondary)"
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        fontSize={10}
                                        width={30}
                                        stroke="var(--text-secondary)"
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'var(--card-bg)', borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                        labelStyle={{ color: 'var(--text-secondary)' }}
                                        itemStyle={{ color: 'var(--text-color)' }}
                                    />
                                    <Area type="step" dataKey="totalInsulin" stroke="#c084fc" strokeWidth={2} fillOpacity={1} fill="url(#colorInsulin)" name="Total Insulin" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                </div>
            ) : (
                <div className="error-state">
                    No data available for this period.
                </div>
            )}

            <style jsx>{`
                .view-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 20px;
                }
                .report-controls {
                    padding: 0 20px 20px;
                    display: flex;
                    justify-content: center;
                }
                .segmented-control {
                    background: var(--bg-secondary, #f3f4f6);
                    padding: 4px;
                    border-radius: 12px;
                    display: flex;
                    gap: 4px;
                }
                .segmented-control button {
                    background: transparent;
                    border: none;
                    padding: 6px 16px;
                    border-radius: 8px;
                    color: var(--text-secondary, #6b7280);
                    font-size: 0.9rem;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-weight: 500;
                }
                .segmented-control button.active {
                    background: var(--card-bg, #ffffff);
                    color: var(--primary-color, #4f46e5);
                    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                }
                .report-content {
                    padding: 0 20px 40px;
                    overflow-y: auto;
                    height: calc(100vh - 180px); /* Adjust based on header/controls height */
                    padding-bottom: 100px;
                }
                .stats-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 12px;
                    margin-bottom: 24px;
                }
                .stat-card {
                    background: var(--card-bg, #ffffff);
                    padding: 16px;
                    border-radius: 20px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.03);
                    border: 1px solid rgba(0,0,0,0.02);
                }
                .stat-icon {
                    width: 40px;
                    height: 40px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 12px;
                }
                .b-blue { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
                .b-green { background: rgba(34, 197, 94, 0.1); color: #22c55e; }
                .b-purple { background: rgba(168, 85, 247, 0.1); color: #a855f7; }
                .b-orange { background: rgba(249, 115, 22, 0.1); color: #f97316; }

                .stat-value {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: var(--text-color, #1f2937);
                    line-height: 1.2;
                }
                .stat-label {
                    font-size: 0.8rem;
                    color: var(--text-secondary, #6b7280);
                    margin-top: 4px;
                }
                .chart-container {
                    background: var(--card-bg, #ffffff);
                    padding: 24px;
                    border-radius: 24px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.03);
                    border: 1px solid rgba(0,0,0,0.02);
                }
                .chart-container h3 {
                    margin: 0 0 20px;
                    font-size: 1rem;
                    color: var(--text-color, #1f2937);
                    font-weight: 600;
                }
                .loading-spinner, .error-state {
                    display: flex;
                    justify-content: center;
                    padding: 60px;
                    color: var(--text-secondary, #6b7280);
                }
            `}</style>
        </section>
    );
}

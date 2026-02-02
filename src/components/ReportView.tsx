'use client';

import { useState, useEffect, useMemo } from 'react';
import {
    ArrowLeft,
    TrendingUp,
    TrendingDown,
    Activity,
    Droplet,
    Utensils,
    Target,
    Calendar,
    Clock,
    Zap,
    Award,
    AlertCircle,
    Lock
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { calculateReportData, ReportData } from '@/lib/utils';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { useUser, SignInButton } from '@clerk/nextjs';
import { useTranslations } from '@/lib/translations';

export default function ReportView({ onBack }: { onBack: () => void }) {
    const { history, settings } = useStore();
    const { user } = useUser();
    const t = useTranslations();
    const [days, setDays] = useState(7);
    const [data, setData] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData(days);
    }, [days, history]);

    const loadData = async (d: number) => {
        setLoading(true);
        const result = calculateReportData(history, d, settings.language);
        if (result && result.summary) {
            setData(result as ReportData);
        }
        setLoading(false);
    };

    // Calculate additional insights
    const insights = useMemo(() => {
        if (!data || !data.summary.count) return null;

        const avgCarbsPerMeal = Math.round(data.summary.totalCarbs / data.summary.count);
        const avgInsulinPerMeal = (data.summary.totalInsulin / data.summary.count).toFixed(1);
        const glucoseChange = data.summary.avgPostGlucose - data.summary.avgPreGlucose;
        const isInRange = data.summary.avgPostGlucose >= (settings.lowThreshold || 70) &&
            data.summary.avgPostGlucose <= (settings.highThreshold || 180);

        return {
            avgCarbsPerMeal,
            avgInsulinPerMeal,
            glucoseChange,
            isInRange,
            mealsPerDay: (data.summary.count / days).toFixed(1)
        };
    }, [data, days, settings]);

    // Prepare chart data - filter out days with no data for cleaner charts
    const chartData = useMemo(() => {
        if (!data?.dailyStats) return [];
        // Use the pre-formatted dateLabel from utils, only include days with actual data
        return data.dailyStats
            .filter(d => d.avgGlucose > 0 || d.totalInsulin > 0)
            .map(d => ({
                ...d,
                displayDate: d.dateLabel || d.date
            }));
    }, [data]);

    // Show locked state for non-logged-in users
    if (!user) {
        return (
            <section className="view report-view" id="report-view">
                {/* Header */}
                <div className="report-header">
                    <button
                        className="back-btn"
                        onClick={onBack}
                        aria-label={t.general.back}
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h1>{t.insights.title}</h1>
                    <div style={{ width: 60 }} />
                </div>

                {/* Blurred Preview with Lock Overlay */}
                <div className="report-locked-container">
                    <div className="report-content-blurred">
                        {/* Preview Cards (blurred) */}
                        <div className="overview-card">
                            <div className="overview-header">
                                <Calendar size={16} />
                                <span>{t.insights.last} 7 {t.insights.days}</span>
                            </div>
                            <div className="overview-stats">
                                <div className="overview-stat main">
                                    <span className="stat-number">12</span>
                                    <span className="stat-text">{t.insights.mealsLogged}</span>
                                </div>
                            </div>
                        </div>
                        <div className="quick-stats">
                            <div className="quick-stat">
                                <div className="stat-icon-wrap teal">
                                    <Droplet size={18} />
                                </div>
                                <div className="stat-content">
                                    <span className="stat-value">48u</span>
                                    <span className="stat-label">{t.insights.totalInsulin}</span>
                                </div>
                            </div>
                            <div className="quick-stat">
                                <div className="stat-icon-wrap orange">
                                    <Utensils size={18} />
                                </div>
                                <div className="stat-content">
                                    <span className="stat-value">520g</span>
                                    <span className="stat-label">{t.insights.totalCarbs}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Lock Overlay */}
                    <div className="report-lock-overlay">
                        <div className="lock-icon-wrap">
                            <Lock size={32} />
                        </div>
                        <h3>{t.insights.unlock}</h3>
                        <p>{t.insights.unlockSub}</p>
                        <SignInButton mode="modal">
                            <button className="btn primary">{t.insights.signIn}</button>
                        </SignInButton>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="view report-view" id="report-view">
            {/* Header */}
            <div className="report-header">
                <button
                    className="back-btn"
                    onClick={onBack}
                    aria-label={t.general.back}
                >
                    <ArrowLeft size={20} />
                </button>
                <h1>{t.insights.title}</h1>
                <div className="period-selector">
                    {[7, 30, 90].map((d) => (
                        <button
                            key={d}
                            className={`period-btn ${days === d ? 'active' : ''}`}
                            onClick={() => setDays(d)}
                        >
                            {d}d
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="report-loading">
                    <div className="spinner" />
                    <span>{t.insights.analyzing}</span>
                </div>
            ) : data && data.summary.count > 0 && insights ? (
                <div className="report-content">
                    {/* Overview Card */}
                    <div className="overview-card">
                        <div className="overview-header">
                            <Calendar size={16} />
                            <span>{t.insights.last} {days} {t.insights.days}</span>
                        </div>
                        <div className="overview-stats">
                            <div className="overview-stat main">
                                <span className="stat-number">{data.summary.count}</span>
                                <span className="stat-text">{t.insights.mealsLogged}</span>
                            </div>
                            <div className="overview-divider" />
                            <div className="overview-stat">
                                <span className="stat-number">{insights.mealsPerDay}</span>
                                <span className="stat-text">{t.insights.perDay}</span>
                            </div>
                        </div>
                    </div>

                    {/* Glucose Summary */}
                    <div className="insight-section">
                        <h3 className="section-title">
                            <Activity size={16} />
                            {t.history.glucoseResponse}
                        </h3>
                        <div className="glucose-summary">
                            <div className="glucose-metric">
                                <span className="metric-label">{t.insights.avgPreMeal}</span>
                                <span className="metric-value">{data.summary.avgPreGlucose || '—'}</span>
                                <span className="metric-unit">{t.history.glucoseUnit}</span>
                            </div>
                            <div className="glucose-arrow">
                                {insights.glucoseChange > 0 ? (
                                    <TrendingUp size={20} className="trend-up" />
                                ) : (
                                    <TrendingDown size={20} className="trend-down" />
                                )}
                                <span className={insights.glucoseChange > 0 ? 'trend-up' : 'trend-down'}>
                                    {insights.glucoseChange > 0 ? '+' : ''}{insights.glucoseChange}
                                </span>
                            </div>
                            <div className="glucose-metric">
                                <span className="metric-label">{t.insights.avgPostMeal}</span>
                                <span className={`metric-value ${insights.isInRange ? 'in-range' : 'out-range'}`}>
                                    {data.summary.avgPostGlucose || '—'}
                                </span>
                                <span className="metric-unit">{t.history.glucoseUnit}</span>
                            </div>
                        </div>
                        {insights.isInRange ? (
                            <div className="range-badge success">
                                <Award size={14} />
                                <span>{t.insights.greatControl}</span>
                            </div>
                        ) : (
                            <div className="range-badge warning">
                                <AlertCircle size={14} />
                                <span>{t.insights.reviewRatios}</span>
                            </div>
                        )}
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="quick-stats">
                        <div className="quick-stat">
                            <div className="stat-icon-wrap teal">
                                <Droplet size={18} />
                            </div>
                            <div className="stat-content">
                                <span className="stat-value">{data.summary.totalInsulin}{t.results.units}</span>
                                <span className="stat-label">{t.insights.totalInsulin}</span>
                            </div>
                        </div>
                        <div className="quick-stat">
                            <div className="stat-icon-wrap orange">
                                <Utensils size={18} />
                            </div>
                            <div className="stat-content">
                                <span className="stat-value">{data.summary.totalCarbs}g</span>
                                <span className="stat-label">{t.insights.totalCarbs}</span>
                            </div>
                        </div>
                        <div className="quick-stat">
                            <div className="stat-icon-wrap blue">
                                <Zap size={18} />
                            </div>
                            <div className="stat-content">
                                <span className="stat-value">{insights.avgInsulinPerMeal}{t.results.units}</span>
                                <span className="stat-label">{t.insights.avgPerMeal}</span>
                            </div>
                        </div>
                        <div className="quick-stat">
                            <div className="stat-icon-wrap green">
                                <Target size={18} />
                            </div>
                            <div className="stat-content">
                                <span className="stat-value">{insights.avgCarbsPerMeal}g</span>
                                <span className="stat-label">{t.insights.avgCarbsPerMeal}</span>
                            </div>
                        </div>
                    </div>

                    {/* Glucose Trend Chart */}
                    {chartData.length > 1 && (
                        <div className="chart-section">
                            <h3 className="section-title">
                                <TrendingUp size={16} />
                                {t.insights.glucoseTrend}
                            </h3>
                            <div className="chart-container">
                                <ResponsiveContainer width="100%" height={160}>
                                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="glucoseGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.3} />
                                                <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis
                                            dataKey="displayDate"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                                            dy={8}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                                            width={35}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                background: 'var(--card)',
                                                border: '1px solid var(--border)',
                                                borderRadius: '8px',
                                                fontSize: '13px'
                                            }}
                                            labelStyle={{ color: 'var(--muted-foreground)' }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="avgGlucose"
                                            stroke="var(--primary)"
                                            strokeWidth={2}
                                            fill="url(#glucoseGradient)"
                                            name={t.insights.glucoseTrend}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* Insulin Usage Chart */}
                    {chartData.length > 1 && (
                        <div className="chart-section">
                            <h3 className="section-title">
                                <Droplet size={16} />
                                {t.insights.dailyInsulin}
                            </h3>
                            <div className="chart-container">
                                <ResponsiveContainer width="100%" height={140}>
                                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <XAxis
                                            dataKey="displayDate"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                                            dy={8}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                                            width={35}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                background: 'var(--card)',
                                                border: '1px solid var(--border)',
                                                borderRadius: '8px',
                                                fontSize: '13px'
                                            }}
                                            labelStyle={{ color: 'var(--muted-foreground)' }}
                                            formatter={(value) => [`${value}${t.results.units}`, t.history.insulin]}
                                        />
                                        <Bar
                                            dataKey="totalInsulin"
                                            radius={[4, 4, 0, 0]}
                                            name={t.history.insulin}
                                        >
                                            {chartData.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill="var(--primary)"
                                                    fillOpacity={0.7 + (index / chartData.length) * 0.3}
                                                />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="report-empty">
                    <div className="empty-visual">
                        <Activity size={40} strokeWidth={1.5} />
                    </div>
                    <h3>{t.insights.noData}</h3>
                    <p>{t.insights.noDataSub}</p>
                </div>
            )}
        </section>
    );
}

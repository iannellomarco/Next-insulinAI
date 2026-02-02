'use client';

import { ArrowLeft, Trash2, Plus, Calendar, Utensils, Link2, X, Activity, Droplet, TrendingUp, TrendingDown, Clock, Loader2 } from 'lucide-react';
import { useStore } from '@/lib/store';
import { useState, useMemo, useEffect } from 'react';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import GlucoseInputModal from '@/components/GlucoseInputModal';
import { HistoryItem } from '@/types';
import GlucoseGraph from './GlucoseGraph';
import { fetchLibreDataAction, GlucoseReading } from '@/app/actions/libre';

function getFoodIcon(name: string): string {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('apple')) return '🍎';
    if (lowerName.includes('sandwich')) return '🥪';
    if (lowerName.includes('salad')) return '🥗';
    if (lowerName.includes('pizza')) return '🍕';
    if (lowerName.includes('coffee') || lowerName.includes('latte')) return '☕';
    if (lowerName.includes('banana')) return '🍌';
    if (lowerName.includes('oat') || lowerName.includes('cereal')) return '🥣';
    if (lowerName.includes('burger')) return '🍔';
    if (lowerName.includes('chicken')) return '🍗';
    if (lowerName.includes('rice')) return '🍚';
    if (lowerName.includes('pasta')) return '🍝';
    if (lowerName.includes('bread') || lowerName.includes('toast')) return '🍞';
    if (lowerName.includes('fries') || lowerName.includes('fry')) return '🍟';
    if (lowerName.includes('beef') || lowerName.includes('steak')) return '🥩';
    if (lowerName.includes('taco')) return '🌮';
    if (lowerName.includes('sushi')) return '🍣';
    return '🍽️';
}

// Group chained items together
interface MealGroup {
    chainId: string | null;
    items: HistoryItem[];
    totalCarbs: number;
    totalInsulin: number;
    actualInsulin?: number;
    timestamp: number;
    preGlucose?: number;
    postGlucose?: number;
    splitBolusAccepted?: boolean;
    splitBolusInfo?: {
        split_percentage?: string;
        duration?: string;
    };
}

export default function HistoryView({ onBack }: { onBack: () => void }) {
    const { history, settings, clearHistory, updateHistoryItem, deleteHistoryItem } = useStore();
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [glucoseModalItem, setGlucoseModalItem] = useState<string | null>(null);
    const [selectedMealGroup, setSelectedMealGroup] = useState<MealGroup | null>(null);
    const [deleteConfirmItem, setDeleteConfirmItem] = useState<string | null>(null);
    const [glucoseData, setGlucoseData] = useState<GlucoseReading[]>([]);
    const [isLoadingGlucose, setIsLoadingGlucose] = useState(false);
    const [debugRange, setDebugRange] = useState<{ oldest: string; newest: string } | null>(null);

    // Scroll to top when component mounts
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
    }, []);

    // Fetch glucose data when a meal is selected
    useEffect(() => {
        if (selectedMealGroup && settings.libreUsername && settings.librePassword) {
            const fetchGlucose = async () => {
                setIsLoadingGlucose(true);
                try {
                    const result = await fetchLibreDataAction();
                    const relevantReadings = result.data.filter((h: GlucoseReading) => {
                        const t = new Date(h.timestamp);
                        return t >= startTime && t <= endTime;
                    });

                    console.log('[GlucoseDebug] Meal:', mealTime.toLocaleString());
                    console.log('[GlucoseDebug] Window:', startTime.toLocaleString(), '-', endTime.toLocaleString());
                    console.log('[GlucoseDebug] Data Count:', result.data.length);
                    if (result.data.length > 0) {
                        console.log('[GlucoseDebug] First Point:', new Date(result.data[0].timestamp).toLocaleString());
                    }
                    console.log('[GlucoseDebug] Relevant Count:', relevantReadings.length);

                    setGlucoseData(relevantReadings);

                    if (relevantReadings.length === 0 && result.debug) {
                        setDebugRange({
                            oldest: result.debug.oldest,
                            newest: result.debug.newest
                        });
                    } else {
                        setDebugRange(null);
                    }
                }
                } catch (e) {
                console.error("Failed to fetch glucose data", e);
            } finally {
                setIsLoadingGlucose(false);
            }
        };
        fetchGlucose();
    } else {
        setGlucoseData([]);
    }
    }, [selectedMealGroup, settings.libreUsername, settings.librePassword]);



const handleDeleteItem = (id: string) => {
    deleteHistoryItem(id);
    setDeleteConfirmItem(null);
};

const handleClearConfirm = () => {
    clearHistory();
    setShowClearConfirm(false);
};

const handleSaveGlucose = (value: number) => {
    if (glucoseModalItem) {
        // If it's a chain, update all items in the chain (post_glucose on last item)
        const item = history.find(h => h.id === glucoseModalItem);
        if (item?.chainId) {
            const chainItems = history.filter(h => h.chainId === item.chainId);
            const lastItem = chainItems.reduce((a, b) =>
                (a.chainIndex || 0) > (b.chainIndex || 0) ? a : b
            );
            updateHistoryItem(lastItem.id, { post_glucose: value });
        } else {
            updateHistoryItem(glucoseModalItem, { post_glucose: value });
        }
        setGlucoseModalItem(null);
    }
};

// Group history items by chain or as individual items
const groupedMeals = useMemo(() => {
    const groups: MealGroup[] = [];
    const processedChains = new Set<string>();

    for (const item of history) {
        if (item.chainId) {
            if (processedChains.has(item.chainId)) continue;
            processedChains.add(item.chainId);

            const chainItems = history
                .filter(h => h.chainId === item.chainId)
                .sort((a, b) => (a.chainIndex || 0) - (b.chainIndex || 0));

            const firstItem = chainItems[0];
            groups.push({
                chainId: item.chainId,
                items: chainItems,
                totalCarbs: chainItems.reduce((sum, i) => sum + i.total_carbs, 0),
                totalInsulin: chainItems.reduce((sum, i) => sum + i.suggested_insulin, 0),
                actualInsulin: firstItem?.actual_insulin,
                timestamp: chainItems[0]?.timestamp || item.timestamp,
                preGlucose: chainItems[0]?.pre_glucose,
                postGlucose: chainItems[chainItems.length - 1]?.post_glucose,
                splitBolusAccepted: firstItem?.split_bolus_accepted,
                splitBolusInfo: firstItem?.split_bolus_recommendation?.recommended ? {
                    split_percentage: firstItem.split_bolus_recommendation.split_percentage,
                    duration: firstItem.split_bolus_recommendation.duration,
                } : undefined,
            });
        } else {
            groups.push({
                chainId: null,
                items: [item],
                totalCarbs: item.total_carbs,
                totalInsulin: item.suggested_insulin,
                actualInsulin: item.actual_insulin,
                timestamp: item.timestamp,
                preGlucose: item.pre_glucose,
                postGlucose: item.post_glucose,
                splitBolusAccepted: item.split_bolus_accepted,
                splitBolusInfo: item.split_bolus_recommendation?.recommended ? {
                    split_percentage: item.split_bolus_recommendation.split_percentage,
                    duration: item.split_bolus_recommendation.duration,
                } : undefined,
            });
        }
    }

    return groups.sort((a, b) => b.timestamp - a.timestamp);
}, [history]);

// Group by date
const groupedByDate = useMemo(() => {
    return groupedMeals.reduce((groups, meal) => {
        const date = new Date(meal.timestamp).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'short',
            day: 'numeric'
        });
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(meal);
        return groups;
    }, {} as Record<string, MealGroup[]>);
}, [groupedMeals]);

return (
    <section id="history-view" className="view">
        <ConfirmationModal
            isOpen={showClearConfirm}
            title="Clear All History?"
            message="This will permanently delete all your meal history. This action cannot be undone."
            confirmText="Delete All"
            cancelText="Cancel"
            isDestructive={true}
            onConfirm={handleClearConfirm}
            onCancel={() => setShowClearConfirm(false)}
        />

        <ConfirmationModal
            isOpen={!!deleteConfirmItem}
            title="Delete This Meal?"
            message="This will permanently delete this meal from your history."
            confirmText="Delete"
            cancelText="Cancel"
            isDestructive={true}
            onConfirm={() => deleteConfirmItem && handleDeleteItem(deleteConfirmItem)}
            onCancel={() => setDeleteConfirmItem(null)}
        />

        {glucoseModalItem && (
            <GlucoseInputModal
                onClose={() => setGlucoseModalItem(null)}
                onSave={handleSaveGlucose}
            />
        )}

        {/* Meal Detail Modal */}
        {selectedMealGroup && (
            <div className="meal-detail-overlay" onClick={() => setSelectedMealGroup(null)}>
                <div className="meal-detail-modal" onClick={(e) => e.stopPropagation()}>
                    <button
                        className="meal-detail-close"
                        onClick={() => setSelectedMealGroup(null)}
                        aria-label="Close details"
                    >
                        <X size={18} />
                    </button>

                    <div className="meal-detail-header">
                        <h3>
                            {selectedMealGroup.items.length > 1
                                ? `Combined Meal (${selectedMealGroup.items.length} items)`
                                : selectedMealGroup.items[0]?.food_items?.[0]?.name || 'Meal Details'}
                        </h3>
                        <span className="meal-detail-time">
                            {new Date(selectedMealGroup.timestamp).toLocaleString([], {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </span>
                    </div>

                    {/* Stats Grid */}
                    <div className="meal-detail-stats">
                        <div className="detail-stat">
                            <Droplet size={16} />
                            <span className="detail-stat-value">
                                {selectedMealGroup.actualInsulin ?? selectedMealGroup.totalInsulin}u
                            </span>
                            <span className="detail-stat-label">
                                {selectedMealGroup.actualInsulin && selectedMealGroup.actualInsulin !== selectedMealGroup.totalInsulin
                                    ? 'Taken'
                                    : 'Insulin'}
                            </span>
                        </div>
                        {selectedMealGroup.actualInsulin && selectedMealGroup.actualInsulin !== selectedMealGroup.totalInsulin && (
                            <div className="detail-stat muted">
                                <span className="detail-stat-value">{selectedMealGroup.totalInsulin}u</span>
                                <span className="detail-stat-label">Suggested</span>
                            </div>
                        )}
                        <div className="detail-stat">
                            <Utensils size={16} />
                            <span className="detail-stat-value">{selectedMealGroup.totalCarbs}g</span>
                            <span className="detail-stat-label">Carbs</span>
                        </div>
                    </div>

                    {/* Split Bolus Info */}
                    {selectedMealGroup.splitBolusAccepted && selectedMealGroup.splitBolusInfo && (
                        <div className="meal-detail-split">
                            <h4>
                                <Clock size={14} />
                                Split Bolus
                            </h4>
                            <div className="split-info-row">
                                <div className="split-info-item">
                                    <span className="split-info-label">Split</span>
                                    <span className="split-info-value">{selectedMealGroup.splitBolusInfo.split_percentage}</span>
                                </div>
                                <div className="split-info-item">
                                    <span className="split-info-label">2nd dose in</span>
                                    <span className="split-info-value">{selectedMealGroup.splitBolusInfo.duration || '1.5 hours'}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Glucose Response */}
                    {(selectedMealGroup.preGlucose || selectedMealGroup.postGlucose) && (
                        <div className="meal-detail-glucose">
                            <h4>
                                <Activity size={14} />
                                Glucose Response
                            </h4>
                            <div className="glucose-response-row">
                                <div className="glucose-point">
                                    <span className="glucose-label">Pre-meal</span>
                                    <span className="glucose-value">
                                        {selectedMealGroup.preGlucose || '—'}
                                    </span>
                                </div>
                                {selectedMealGroup.preGlucose && selectedMealGroup.postGlucose && (
                                    <div className="glucose-change">
                                        {selectedMealGroup.postGlucose > selectedMealGroup.preGlucose ? (
                                            <TrendingUp size={16} className="trend-up" />
                                        ) : (
                                            <TrendingDown size={16} className="trend-down" />
                                        )}
                                        <span className={
                                            selectedMealGroup.postGlucose > selectedMealGroup.preGlucose
                                                ? 'trend-up'
                                                : 'trend-down'
                                        }>
                                            {selectedMealGroup.postGlucose > selectedMealGroup.preGlucose ? '+' : ''}
                                            {selectedMealGroup.postGlucose - selectedMealGroup.preGlucose}
                                        </span>
                                    </div>
                                )}
                                <div className="glucose-point">
                                    <span className="glucose-label">2h Post</span>
                                    <span className={`glucose-value ${selectedMealGroup.postGlucose && selectedMealGroup.postGlucose > settings.highThreshold
                                        ? 'high'
                                        : selectedMealGroup.postGlucose && selectedMealGroup.postGlucose < settings.lowThreshold
                                            ? 'low'
                                            : ''
                                        }`}>
                                        {selectedMealGroup.postGlucose || '—'}
                                    </span>
                                </div>
                            </div>

                            {/* Live Graph from Libre */}
                            {settings.libreUsername && (
                                <div className="glucose-graph-container" style={{
                                    backgroundColor: '#f8fafc',
                                    borderRadius: '12px',
                                    padding: '12px',
                                    marginTop: '8px'
                                }}>
                                    {isLoadingGlucose ? (
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '150px', gap: '8px', color: '#64748b' }}>
                                            <Loader2 className="animate-spin" size={20} />
                                            <span style={{ fontSize: '13px' }}>Loading Libre data...</span>
                                        </div>
                                    ) : glucoseData.length > 0 ? (
                                        <GlucoseGraph
                                            data={glucoseData}
                                            mealTime={new Date(selectedMealGroup.timestamp)}
                                            height={200}
                                        />
                                    ) : (
                                        <div style={{ padding: '12px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                                            <p>No glucose data available for this period.</p>
                                            {debugRange && (
                                                <div style={{ marginTop: '8px', fontSize: '11px', color: '#94a3b8', background: '#f1f5f9', padding: '6px', borderRadius: '6px' }}>
                                                    <p><strong>Debug Info:</strong></p>
                                                    <p>Available Range:</p>
                                                    <p>{new Date(debugRange.oldest).toLocaleString()} -</p>
                                                    <p>{new Date(debugRange.newest).toLocaleString()}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Food Items */}
                    <div className="meal-detail-foods">
                        <h4>Foods</h4>
                        {selectedMealGroup.items.map((item, idx) => (
                            <div key={item.id} className="detail-food-item">
                                <span className="detail-food-icon">
                                    {getFoodIcon(item.food_items?.[0]?.name || '')}
                                </span>
                                <div className="detail-food-info">
                                    <span className="detail-food-name">
                                        {item.food_items?.[0]?.name || 'Unknown'}
                                    </span>
                                    <span className="detail-food-macros">
                                        {item.total_carbs}g carbs · {item.total_fat}g fat · {item.total_protein}g protein
                                    </span>
                                </div>
                                <span className="detail-food-insulin">{item.suggested_insulin}u</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

        <div className="view-header">
            <button
                className="icon-btn"
                onClick={onBack}
                aria-label="Go back"
            >
                <ArrowLeft size={22} />
            </button>
            <h2>Meal History</h2>
            <button
                className="icon-btn"
                aria-label="Clear all history"
                onClick={() => {
                    if (history.length > 0) setShowClearConfirm(true);
                }}
                disabled={history.length === 0}
                style={{
                    opacity: history.length === 0 ? 0.4 : 1,
                    color: history.length > 0 ? 'var(--destructive)' : undefined
                }}
            >
                <Trash2 size={20} />
            </button>
        </div>

        <div id="history-list" className="history-list">
            {history.length === 0 ? (
                <div className="empty-history">
                    <div className="empty-icon">
                        <Utensils size={32} strokeWidth={1.5} />
                    </div>
                    <h3>No meals logged yet</h3>
                    <p>Scan or enter your first meal to start tracking</p>
                </div>
            ) : (
                Object.entries(groupedByDate).map(([date, meals]) => (
                    <div key={date} className="history-group">
                        <div className="history-date">
                            <Calendar size={14} />
                            <span>{date}</span>
                        </div>
                        {meals.map((mealGroup) => {
                            const isChained = mealGroup.items.length > 1;
                            const isHigh = mealGroup.postGlucose && mealGroup.postGlucose > settings.highThreshold;
                            const isLow = mealGroup.postGlucose && mealGroup.postGlucose < settings.lowThreshold;
                            const itemId = mealGroup.chainId || mealGroup.items[0]?.id;

                            return (
                                <div
                                    key={itemId}
                                    className="history-item-container"
                                >
                                    <div
                                        className={`history-item-wrapper ${isChained ? 'chained' : ''}`}
                                        onClick={() => setSelectedMealGroup(mealGroup)}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => e.key === 'Enter' && setSelectedMealGroup(mealGroup)}
                                    >
                                        {isChained ? (
                                            // Chained meal display
                                            <div className="chained-meal-card">
                                                <div className="chain-connector">
                                                    <Link2 size={14} />
                                                </div>
                                                <div className="chained-content">
                                                    <div className="chained-items">
                                                        {mealGroup.items.map((item, idx) => {
                                                            const foodName = item.food_items?.[0]?.name || 'Unknown';
                                                            return (
                                                                <div
                                                                    key={item.id}
                                                                    className={`chained-item ${idx === 0 ? 'first' : ''} ${idx === mealGroup.items.length - 1 ? 'last' : ''}`}
                                                                >
                                                                    <div className="chained-item-icon">
                                                                        {getFoodIcon(foodName)}
                                                                    </div>
                                                                    <span className="chained-item-name">{foodName}</span>
                                                                    <span className="chained-item-carbs">{item.total_carbs}g</span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                    <div className="chained-footer">
                                                        <span className="chained-time">
                                                            {new Date(mealGroup.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                        {mealGroup.postGlucose ? (
                                                            <span className={`stat-post ${isHigh ? 'high' : ''} ${isLow ? 'low' : ''}`}>
                                                                2h: {mealGroup.postGlucose}
                                                            </span>
                                                        ) : (
                                                            <button
                                                                className="add-glucose-btn"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setGlucoseModalItem(mealGroup.items[0]?.id);
                                                                }}
                                                            >
                                                                <Plus size={12} />
                                                                Add 2h
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="chained-summary">
                                                    <span className="history-dose">{mealGroup.actualInsulin ?? mealGroup.totalInsulin}u</span>
                                                    <span className="total-label">{mealGroup.totalCarbs}g</span>
                                                    {mealGroup.splitBolusAccepted && (
                                                        <span className="split-badge">
                                                            <Clock size={10} />
                                                            Split
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            // Single meal display
                                            <div className="history-item">
                                                <div className="history-item-icon">
                                                    {getFoodIcon(mealGroup.items[0]?.food_items?.[0]?.name || '')}
                                                </div>
                                                <div className="history-item-content">
                                                    <div className="history-main">
                                                        <span className="history-food">
                                                            {mealGroup.items[0]?.food_items?.[0]?.name || 'Unknown'}
                                                        </span>
                                                        <span className="history-dose">{mealGroup.actualInsulin ?? mealGroup.totalInsulin}u</span>
                                                    </div>
                                                    <div className="history-stats">
                                                        <span className="stat-carbs">{mealGroup.totalCarbs}g carbs</span>
                                                        {mealGroup.preGlucose && (
                                                            <span className="stat-pre">Pre: {mealGroup.preGlucose}</span>
                                                        )}
                                                        {mealGroup.postGlucose ? (
                                                            <span className={`stat-post ${isHigh ? 'high' : ''} ${isLow ? 'low' : ''}`}>
                                                                2h: {mealGroup.postGlucose}
                                                                {isLow && ' ↓'}
                                                                {isHigh && ' ↑'}
                                                            </span>
                                                        ) : (
                                                            <button
                                                                className="add-glucose-btn"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setGlucoseModalItem(mealGroup.items[0]?.id);
                                                                }}
                                                            >
                                                                <Plus size={14} />
                                                                <span>Add 2h</span>
                                                            </button>
                                                        )}
                                                        {mealGroup.splitBolusAccepted && (
                                                            <span className="split-badge">
                                                                <Clock size={12} />
                                                                Split
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="history-time">
                                                        {new Date(mealGroup.timestamp).toLocaleTimeString([], {
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Delete button */}
                                    <button
                                        className="history-delete-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setDeleteConfirmItem(itemId);
                                        }}
                                        aria-label="Delete meal"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                ))
            )}
        </div>
    </section>
);
}

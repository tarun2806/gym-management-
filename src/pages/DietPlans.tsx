
import React, { useState, useEffect } from 'react';
import {
    Utensils,
    Apple,
    Target,
    Flame,
    ArrowRight,
    Droplets,
    Egg,
    Leaf,
    Trash2,
    Calendar,
    Sparkles,
    AlertCircle,
    BrainCircuit,
    Cpu,
    Zap,
    History,
    ChefHat,
    Scale
} from 'lucide-react';
import { Card, Button } from '../components';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface MacroDistribution {
    protein: number;
    carbs: number;
    fats: number;
}

interface Meal {
    id: number;
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    image: string;
}

interface DailyPlan {
    breakfast: Meal[];
    lunch: Meal[];
    dinner: Meal[];
    snacks: Meal[];
}

interface FullPlan {
    id: string;
    date: string;
    calories: number;
    macros: MacroDistribution;
    goals: string;
    description: string;
    meals: DailyPlan;
    dietPreference: string;
}

// South Indian Meal Repository
const MEAL_TEMPLATES: Record<string, Record<string, any[]>> = {
    breakfast: {
        veg: [
            { name: "Masala Dosa with Sambar", calories: 350, protein: 8, carbs: 55, fats: 12 },
            { name: "Idli (3 pcs) with Coconut Chutney", calories: 300, protein: 10, carbs: 50, fats: 8 },
            { name: "Ven Pongal with Goshu", calories: 400, protein: 12, carbs: 60, fats: 14 },
            { name: "Rava Upma with Vegetables", calories: 320, protein: 9, carbs: 45, fats: 11 }
        ],
        eggitarian: [
            { name: "Egg Dosa (Muttai Dosa)", calories: 400, protein: 18, carbs: 45, fats: 16 },
            { name: "Boiled Eggs (2) & Ragi Malt", calories: 350, protein: 20, carbs: 35, fats: 14 },
            { name: "Omelette with Toast", calories: 380, protein: 22, carbs: 30, fats: 18 }
        ],
        'non-veg': [
            { name: "Egg Dosa & Chicken Curry", calories: 550, protein: 35, carbs: 40, fats: 25 },
            { name: "Puttu with Kadala Curry", calories: 450, protein: 12, carbs: 70, fats: 15 }
        ]
    },
    lunch: {
        veg: [
            { name: "Sambar Rice with Aviyal", calories: 450, protein: 12, carbs: 75, fats: 12 },
            { name: "Curd Rice & Pickle", calories: 350, protein: 10, carbs: 60, fats: 8 },
            { name: "Brown Rice with Mixed Veg Poriyal", calories: 420, protein: 11, carbs: 70, fats: 10 }
        ],
        eggitarian: [
            { name: "Egg Biryani (Small portion)", calories: 550, protein: 25, carbs: 70, fats: 18 },
            { name: "Rice with Egg Thokku", calories: 500, protein: 22, carbs: 65, fats: 15 }
        ],
        'non-veg': [
            { name: "South Indian Fish Curry & Rice", calories: 500, protein: 35, carbs: 60, fats: 12 },
            { name: "Chicken Chettinad with Rice", calories: 600, protein: 40, carbs: 65, fats: 20 },
            { name: "Mutton Kuzhambu with Ragi Mudde", calories: 650, protein: 45, carbs: 70, fats: 25 }
        ]
    },
    snacks: {
        veg: [
            { name: "Sundal (Chickpeas)", calories: 150, protein: 8, carbs: 20, fats: 3 },
            { name: "Roasted Makhana", calories: 100, protein: 3, carbs: 15, fats: 4 },
            { name: "Fruit Salad", calories: 120, protein: 1, carbs: 28, fats: 0 }
        ],
        eggitarian: [
            { name: "Boiled Egg (1)", calories: 75, protein: 6, carbs: 1, fats: 5 },
            { name: "Egg Salad", calories: 180, protein: 12, carbs: 5, fats: 12 }
        ],
        'non-veg': [
            { name: "Chicken Kebab (2 pcs)", calories: 220, protein: 20, carbs: 5, fats: 14 }
        ]
    },
    dinner: {
        veg: [
            { name: "Chappati (2) with Dal Tadka", calories: 380, protein: 15, carbs: 55, fats: 10 },
            { name: "Millet Upma", calories: 320, protein: 10, carbs: 50, fats: 8 },
            { name: "Vegetable Soup & Wheat Bread", calories: 280, protein: 8, carbs: 40, fats: 6 }
        ],
        eggitarian: [
            { name: "Egg Bujiya with Multi-grain Bread", calories: 420, protein: 22, carbs: 45, fats: 16 },
            { name: "Scrambled Eggs with Steamed Veggies", calories: 350, protein: 25, carbs: 15, fats: 20 }
        ],
        'non-veg': [
            { name: "Grilled Chicken & Sautéed Greens", calories: 450, protein: 45, carbs: 10, fats: 12 },
            { name: "Fish Fry & Salad", calories: 400, protein: 38, carbs: 12, fats: 18 }
        ]
    }
};

const DietPlans: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'generator' | 'my-plans'>('generator');
    const [isGenerating, setIsGenerating] = useState(false);
    const [savedPlans, setSavedPlans] = useState<FullPlan[]>([]);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        age: '',
        gender: 'male',
        height: '',
        weight: '',
        activityLevel: '1.2',
        goal: 'fat-loss',
        dietPreference: 'non-veg'
    });

    const [generatedPlan, setGeneratedPlan] = useState<FullPlan | null>(null);

    useEffect(() => {
        const saved = localStorage.getItem('gym_diet_plans');
        if (saved) {
            setSavedPlans(JSON.parse(saved));
        }
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const savePlan = () => {
        if (!generatedPlan) return;
        const newPlan = { ...generatedPlan, id: Date.now().toString(), date: new Date().toLocaleDateString() };
        const updatedPlans = [newPlan, ...savedPlans];
        setSavedPlans(updatedPlans);
        localStorage.setItem('gym_diet_plans', JSON.stringify(updatedPlans));
        alert('Diet strategy saved successfully!');
    };

    const deletePlan = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const updatedPlans = savedPlans.filter(p => p.id !== id);
        setSavedPlans(updatedPlans);
        localStorage.setItem('gym_diet_plans', JSON.stringify(updatedPlans));
    };

    const loadPlan = (plan: FullPlan) => {
        setGeneratedPlan(plan);
        setActiveTab('generator');
        setFormData(prev => ({
            ...prev,
            goal: plan.goals,
            dietPreference: plan.dietPreference
        }));
    };

    const generateLocalPlan = () => {
        if (!formData.age || !formData.height || !formData.weight) {
            setError("Please complete all profile details.");
            return;
        }

        setIsGenerating(true);
        setError(null);

        // Simulate calculation delay for "AI feel"
        setTimeout(() => {
            try {
                const age = parseInt(formData.age);
                const height = parseInt(formData.height);
                const weight = parseInt(formData.weight);
                const activity = parseFloat(formData.activityLevel);

                // BMR (Mifflin-St Jeor)
                let bmr = (10 * weight) + (6.25 * height) - (5 * age);
                bmr = formData.gender === 'male' ? bmr + 5 : bmr - 161;

                // TDEE
                const tdee = bmr * activity;

                // Calorie Target
                let targetCalories = tdee;
                let macroSplit = { protein: 30, carbs: 40, fats: 30 };
                let goalDesc = "";

                if (formData.goal === 'fat-loss') {
                    targetCalories -= 500;
                    macroSplit = { protein: 40, carbs: 30, fats: 30 };
                    goalDesc = "High protein fat mobilization strategy.";
                } else if (formData.goal === 'muscle-gain') {
                    targetCalories += 400;
                    macroSplit = { protein: 30, carbs: 50, fats: 20 };
                    goalDesc = "Hypertrophy fuel protocol.";
                } else {
                    goalDesc = "Maintenance and vitality optimization.";
                }

                targetCalories = Math.round(targetCalories);

                const getMeal = (type: string, preference: string) => {
                    const options = MEAL_TEMPLATES[type][preference] || MEAL_TEMPLATES[type]['veg'];
                    const meal = options[Math.floor(Math.random() * options.length)];
                    return {
                        ...meal,
                        id: Math.random(),
                        image: getPlaceholderImage(type, preference)
                    };
                };

                const finalPlan: FullPlan = {
                    id: Date.now().toString(),
                    date: new Date().toLocaleDateString(),
                    calories: targetCalories,
                    macros: macroSplit,
                    goals: formData.goal,
                    description: `Automated Nutritional Strategy: ${goalDesc} Designed for a ${formData.age}-year-old ${formData.gender} weighing ${formData.weight}kg.`,
                    dietPreference: formData.dietPreference,
                    meals: {
                        breakfast: [getMeal('breakfast', formData.dietPreference)],
                        lunch: [getMeal('lunch', formData.dietPreference)],
                        snacks: [getMeal('snacks', formData.dietPreference)],
                        dinner: [getMeal('dinner', formData.dietPreference)]
                    }
                };

                setGeneratedPlan(finalPlan);
            } catch (err) {
                setError("Nutritional calculation error. Check your inputs.");
            } finally {
                setIsGenerating(false);
            }
        }, 1500);
    };

    const getPlaceholderImage = (type: string, preference: string) => {
        const images: Record<string, string> = {
            breakfast_veg: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&q=80&w=600',
            breakfast_nonveg: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&q=80&w=600',
            lunch_veg: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=600',
            lunch_nonveg: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&q=80&w=600',
            snacks: 'https://images.unsplash.com/photo-1596450523265-27a909404283?auto=format&fit=crop&q=80&w=600',
            dinner: 'https://images.unsplash.com/photo-1626202168236-47a743b17730?auto=format&fit=crop&q=80&w=600'
        };
        if (type === 'snacks') return images.snacks;
        if (type === 'dinner') return images.dinner;
        const key = `${type}_${preference === 'veg' ? 'veg' : 'non-veg'}`;
        return images[key] || images.lunch_veg;
    };

    const MacroDistributionChart = ({ protein, carbs, fats }: MacroDistribution) => {
        const data = [
            { name: 'Protein', value: protein, color: '#6366F1' },
            { name: 'Carbs', value: carbs, color: '#10B981' },
            { name: 'Fats', value: fats, color: '#F59E0B' },
        ];

        return (
            <div className="h-40 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={70}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                        <span className="text-[10px] font-black uppercase text-slate-400 block tracking-widest">Logic</span>
                        <span className="text-lg font-black text-slate-900 leading-none">SPLIT</span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-8 pb-12 animate-in fade-in duration-500 font-sans">
            {/* Header Block */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 text-indigo-600 font-black uppercase tracking-widest text-[9px] mb-2">
                        <Scale className="h-3.5 w-3.5" /> Nutrition Engine
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none flex items-center gap-4">
                        Diet Plans
                        <span className="px-3 py-1 bg-indigo-500 text-white text-[9px] font-bold uppercase tracking-widest rounded-full shadow-md">
                            Smart Core
                        </span>
                    </h1>
                    <p className="text-slate-500 mt-2 text-base font-medium max-w-xl">Generate specialized South Indian diet strategies based on your biological profile.</p>
                </div>

                <div className="flex bg-slate-100 p-1 rounded-2xl shadow-inner border border-slate-200">
                    <button
                        className={`h-11 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'generator' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-900'}`}
                        onClick={() => setActiveTab('generator')}
                    >
                        Generator
                    </button>
                    <button
                        className={`h-11 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'my-plans' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-900'}`}
                        onClick={() => setActiveTab('my-plans')}
                    >
                        Vault
                    </button>
                </div>
            </div>

            {activeTab === 'generator' ? (
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                    {/* Input Area */}
                    <div className="xl:col-span-1 space-y-6">
                        <Card className="p-6 rounded-2xl border-0 shadow-xl shadow-slate-100 bg-white">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                                    <Cpu className="h-5 w-5" />
                                </div>
                                <h2 className="text-lg font-bold text-slate-900 tracking-tight">Biometrics</h2>
                            </div>

                            <form className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Gender</label>
                                        <select
                                            name="gender"
                                            value={formData.gender}
                                            onChange={handleInputChange}
                                            className="w-full h-11 px-4 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-indigo-50 font-bold outline-none text-xs appearance-none"
                                        >
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Age</label>
                                        <input
                                            type="number"
                                            name="age"
                                            value={formData.age}
                                            onChange={handleInputChange}
                                            placeholder="25"
                                            className="w-full h-11 px-4 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-indigo-50 font-bold outline-none text-xs"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Height (CM)</label>
                                        <input
                                            type="number"
                                            name="height"
                                            value={formData.height}
                                            onChange={handleInputChange}
                                            placeholder="175"
                                            className="w-full h-11 px-4 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-indigo-50 font-bold outline-none text-xs text-center"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Weight (KG)</label>
                                        <input
                                            type="number"
                                            name="weight"
                                            value={formData.weight}
                                            onChange={handleInputChange}
                                            placeholder="70"
                                            className="w-full h-11 px-4 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-indigo-50 font-bold outline-none text-xs text-center"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Activity Level</label>
                                    <select
                                        name="activityLevel"
                                        value={formData.activityLevel}
                                        onChange={handleInputChange}
                                        className="w-full h-11 px-4 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-indigo-50 font-bold outline-none text-xs appearance-none"
                                    >
                                        <option value="1.2">Sedentary (No exercise)</option>
                                        <option value="1.375">Light (1-2 days/week)</option>
                                        <option value="1.55">Moderate (3-5 days/week)</option>
                                        <option value="1.725">Heavy (6-7 days/week)</option>
                                        <option value="1.9">Athlete (Intense training)</option>
                                    </select>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Diet Type</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { id: 'veg', label: 'VEG', icon: Leaf },
                                            { id: 'eggitarian', label: 'EGG', icon: Egg },
                                            { id: 'non-veg', label: 'MEAT', icon: ChefHat },
                                        ].map((type) => (
                                            <button
                                                key={type.id}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, dietPreference: type.id })}
                                                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${formData.dietPreference === type.id
                                                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                                    : 'border-slate-50 bg-slate-50 text-slate-400 hover:border-slate-100 hover:bg-white'
                                                    }`}
                                            >
                                                <type.icon className="h-4 w-4 mb-1.5" />
                                                <span className="text-[9px] font-bold">{type.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Goal</label>
                                    <div className="grid grid-cols-1 gap-2">
                                        {[
                                            { id: 'fat-loss', label: 'Fat Loss', icon: Flame, color: 'hover:border-rose-200 hover:bg-rose-50' },
                                            { id: 'muscle-gain', label: 'Muscle Gain', icon: Zap, color: 'hover:border-indigo-200 hover:bg-indigo-50' },
                                            { id: 'maintenance', label: 'Maintenance', icon: Target, color: 'hover:border-emerald-200 hover:bg-emerald-50' }
                                        ].map((goal) => (
                                            <button
                                                key={goal.id}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, goal: goal.id })}
                                                className={`flex items-center gap-3 h-12 px-4 rounded-xl border-2 font-bold transition-all ${formData.goal === goal.id
                                                    ? 'border-slate-900 bg-slate-900 text-white shadow-lg shadow-slate-200'
                                                    : `border-slate-50 bg-slate-50 text-slate-500 ${goal.color}`
                                                    }`}
                                            >
                                                <goal.icon className="h-4 w-4" />
                                                <span className="text-[10px] uppercase tracking-widest">{goal.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {error && (
                                    <div className="p-4 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-bold leading-relaxed flex gap-3 italic">
                                        <AlertCircle className="h-4 w-4 flex-shrink-0" /> {error}
                                    </div>
                                )}

                                <button
                                    type="button"
                                    onClick={generateLocalPlan}
                                    disabled={isGenerating}
                                    className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 shadow-xl shadow-slate-200 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                                >
                                    {isGenerating ? (
                                        <>
                                            <div className="h-4 w-4 border-2 border-white border-t-transparent animate-spin rounded-full" />
                                            Analysing...
                                        </>
                                    ) : (
                                        <>
                                            <Zap className="h-4 w-4 text-indigo-400" />
                                            Generate Plan
                                        </>
                                    )}
                                </button>
                            </form>
                        </Card>
                    </div>

                    {/* Result Area */}
                    <div className="xl:col-span-3 space-y-8">
                        {generatedPlan ? (
                            <div className="animate-in slide-in-from-bottom-6 duration-500 space-y-8">
                                {/* Summary Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <Card className="md:col-span-2 p-8 bg-slate-900 text-white border-0 rounded-[32px] relative overflow-hidden shadow-xl shadow-slate-200">
                                        <div className="absolute top-0 right-0 p-8 opacity-5">
                                            <Flame className="h-32 w-32" />
                                        </div>
                                        <div className="relative z-10">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 italic">Target Daily Consumption</p>
                                            <div className="flex items-baseline gap-3 mb-6">
                                                <h3 className="text-5xl font-black tracking-tighter text-indigo-400">{generatedPlan.calories}</h3>
                                                <span className="text-base font-bold text-slate-500 uppercase tracking-widest italic">KCAL</span>
                                            </div>
                                            <div className="pt-6 border-t border-white/5">
                                                <p className="text-sm font-medium text-slate-300 leading-relaxed italic max-w-2xl">
                                                    "{generatedPlan.description}"
                                                </p>
                                            </div>
                                        </div>
                                    </Card>

                                    <Card className="p-8 bg-white border-0 rounded-[32px] shadow-xl shadow-slate-100 flex flex-col justify-center">
                                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 text-center">Macro Profile</h3>
                                        <MacroDistributionChart {...generatedPlan.macros} />
                                        <div className="mt-6 space-y-3">
                                            {[
                                                { label: 'Protein', val: generatedPlan.macros.protein, color: 'bg-indigo-500' },
                                                { label: 'Carbs', val: generatedPlan.macros.carbs, color: 'bg-emerald-500' },
                                                { label: 'Fats', val: generatedPlan.macros.fats, color: 'bg-amber-500' },
                                            ].map((m, i) => (
                                                <div key={i} className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`h-1.5 w-1.5 rounded-full ${m.color}`} />
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{m.label}</span>
                                                    </div>
                                                    <span className="text-xs font-black text-slate-900">{m.val}%</span>
                                                </div>
                                            ))}
                                        </div>
                                    </Card>
                                </div>

                                {/* Controls */}
                                <div className="flex items-center justify-between">
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                                        Meal Matrix <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                    </h3>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={savePlan}
                                            className="h-11 px-6 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-md"
                                        >
                                            Save Strategy
                                        </button>
                                        <button
                                            onClick={() => window.print()}
                                            className="h-11 px-6 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg flex items-center gap-2"
                                        >
                                            Export PDF <ArrowRight className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Meal Matrix */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {[
                                        { title: 'Breakfast', icon: Apple, meals: generatedPlan.meals.breakfast, color: 'text-rose-500' },
                                        { title: 'Lunch', icon: Utensils, meals: generatedPlan.meals.lunch, color: 'text-indigo-500' },
                                        { title: 'Snacks', icon: Droplets, meals: generatedPlan.meals.snacks, color: 'text-amber-500' },
                                        { title: 'Dinner', icon: ChefHat, meals: generatedPlan.meals.dinner, color: 'text-slate-900' }
                                    ].map((section, idx) => (
                                        <Card key={idx} className="overflow-hidden rounded-[32px] border-0 shadow-xl shadow-slate-100 bg-white group">
                                            <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30 group-hover:bg-slate-50/80 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className={`h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center ${section.color}`}>
                                                        <section.icon className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-base font-black text-slate-900 tracking-tight leading-none">{section.title}</h4>
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Recommended Meal</p>
                                                    </div>
                                                </div>
                                                <div className="px-3 py-1 bg-slate-900 rounded-full text-[9px] font-bold text-white tracking-widest">
                                                    {section.meals.reduce((acc, m) => acc + m.calories, 0)} KCAL
                                                </div>
                                            </div>
                                            <div className="divide-y divide-slate-50">
                                                {section.meals.map((meal) => (
                                                    <div key={meal.id} className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6 group/item hover:bg-slate-50 transition-colors">
                                                        <div className="h-24 w-24 sm:h-20 sm:w-20 rounded-2xl overflow-hidden shadow-md group-hover/item:scale-105 transition-transform duration-500 flex-shrink-0">
                                                            <img src={meal.image} alt={meal.name} className="h-full w-full object-cover" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <h4 className="text-lg font-black text-slate-900 tracking-tight group-hover/item:text-indigo-600 transition-colors">{meal.name}</h4>
                                                            <div className="grid grid-cols-4 gap-2 mt-4">
                                                                <div className="bg-white border border-indigo-100 px-2 py-1.5 rounded-lg text-center">
                                                                    <p className="text-[7px] font-bold text-indigo-400 uppercase">Pro</p>
                                                                    <p className="text-xs font-bold text-indigo-600">{meal.protein}g</p>
                                                                </div>
                                                                <div className="bg-white border border-emerald-100 px-2 py-1.5 rounded-lg text-center">
                                                                    <p className="text-[7px] font-bold text-emerald-400 uppercase">Carb</p>
                                                                    <p className="text-xs font-bold text-emerald-600">{meal.carbs}g</p>
                                                                </div>
                                                                <div className="bg-white border border-amber-100 px-2 py-1.5 rounded-lg text-center">
                                                                    <p className="text-[7px] font-bold text-amber-400 uppercase">Fat</p>
                                                                    <p className="text-xs font-bold text-amber-600">{meal.fats}g</p>
                                                                </div>
                                                                <div className="bg-slate-900 px-2 py-1.5 rounded-lg text-center shadow-lg shadow-slate-200">
                                                                    <p className="text-[7px] font-bold text-slate-500 uppercase">Cal</p>
                                                                    <p className="text-xs font-bold text-white">{meal.calories}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="h-full min-h-[500px] flex flex-col items-center justify-center p-12 bg-white shadow-xl shadow-slate-50 rounded-[48px] border-4 border-dashed border-slate-100">
                                <div className="h-24 w-24 bg-indigo-50 rounded-[32px] flex items-center justify-center mb-6 shadow-inner">
                                    <Utensils className="h-10 w-10 text-indigo-400" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">Strategy Pending</h3>
                                <p className="text-slate-400 text-base font-medium max-w-sm mx-auto text-center italic leading-relaxed">
                                    Input your biometrics on the left to activate the nutritional engine and generate your personalized South Indian meal protocol.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {savedPlans.length > 0 ? (
                        savedPlans.map((plan) => (
                            <Card key={plan.id} className="rounded-3xl border-0 shadow-xl shadow-slate-100 hover:shadow-indigo-50 transition-all group bg-white overflow-hidden flex flex-col">
                                <div className="p-8 flex-grow">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border
                      ${plan.goals === 'fat-loss' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                plan.goals === 'muscle-gain' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                                    'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                                            {plan.goals.replace('-', ' ')}
                                        </div>
                                        <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-widest">
                                            <Calendar className="h-3 w-3" />
                                            {plan.date}
                                        </span>
                                    </div>

                                    <h3 className="text-4xl font-black text-slate-900 tracking-tight mb-1">
                                        {plan.calories} <span className="text-lg font-black text-slate-400 uppercase italic">kcal</span>
                                    </h3>
                                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest flex items-center italic mb-8">
                                        <ChefHat className="h-3.5 w-3.5 mr-1.5" />
                                        {plan.dietPreference === 'veg' ? 'VEG' : plan.dietPreference === 'eggitarian' ? 'EGGITARIY' : 'NON-VEG'}
                                    </p>

                                    <div className="grid grid-cols-3 gap-3 mb-6">
                                        <div className="text-center p-3 bg-slate-50 rounded-2xl group-hover:bg-indigo-100/50 transition-colors">
                                            <p className="text-[8px] font-bold text-slate-400 uppercase">Pro</p>
                                            <p className="text-base font-black text-indigo-600">{plan.macros.protein}%</p>
                                        </div>
                                        <div className="text-center p-3 bg-slate-50 rounded-2xl group-hover:bg-emerald-100/50 transition-colors">
                                            <p className="text-[8px] font-bold text-slate-400 uppercase">Carb</p>
                                            <p className="text-base font-black text-emerald-600">{plan.macros.carbs}%</p>
                                        </div>
                                        <div className="text-center p-3 bg-slate-50 rounded-2xl group-hover:bg-amber-100/50 transition-colors">
                                            <p className="text-[8px] font-bold text-slate-400 uppercase">Fat</p>
                                            <p className="text-base font-black text-amber-600">{plan.macros.fats}%</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between group-hover:bg-slate-100/50 transition-colors">
                                    <button onClick={() => loadPlan(plan)} className="text-[10px] font-black text-slate-900 hover:text-indigo-600 transition-colors uppercase tracking-widest flex items-center gap-2">
                                        View Protocol <ArrowRight className="h-3 w-3" />
                                    </button>
                                    <button onClick={(e) => deletePlan(plan.id, e)} className="p-2.5 bg-white text-slate-400 hover:text-rose-600 rounded-xl shadow-sm transition-all hover:scale-110">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </Card>
                        ))
                    ) : (
                        <Card className="col-span-full py-24 text-center rounded-[48px] border-4 border-dashed border-slate-100 flex flex-col items-center">
                            <History className="h-16 w-16 text-slate-200 mb-6" />
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Archive Empty</h3>
                            <p className="text-slate-400 max-w-sm mt-2 text-sm font-medium italic">Your personalized diet protocols will appear here once saved.</p>
                            <Button variant="outline" className="mt-8 rounded-2xl h-12 px-8 text-[10px] font-black uppercase tracking-widest" onClick={() => setActiveTab('generator')}>Open Engine</Button>
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
};

export default DietPlans;

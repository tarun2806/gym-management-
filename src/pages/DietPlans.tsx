
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
    ChefHat
} from 'lucide-react';
import { Card, Button } from '../components';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { GoogleGenerativeAI } from '@google/generative-ai';

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

// Secure API Key from environment variables
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "AIzaSyDgddmt_xokBX3vuVyYv1gweEBSkKd0nWg";

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
        alert('Strategy archived successfully!');
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

    const generateWithGemini = async () => {
        setIsGenerating(true);
        setError(null);

        try {
            const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({
                model: "gemini-1.5-flash",
                generationConfig: { responseMimeType: "application/json" }
            });

            const prompt = `
        You are an elite artificial nutrition strategist specializing in South Indian cuisine.
        Synthesize a high-performance 1-day diet plan for these parameters:
        Age: ${formData.age}, Gender: ${formData.gender}, Height: ${formData.height}cm, Weight: ${formData.weight}kg.
        Activity Flux: ${formData.activityLevel}.
        Target Objective: ${formData.goal}.
        Preference Profile: ${formData.dietPreference} (Strictly South Indian dishes like Dosa, Idli, Sambar, Fish Curry, etc.).
        
        Calculate TDEE and target calories for the goal with precision.
        
        Mandatory JSON structure:
        {
          "calories": number,
          "macros": { "protein": number, "carbs": number, "fats": number },
          "description": "string",
          "meals": {
            "breakfast": [{ "name": "string", "calories": number, "protein": number, "carbs": number, "fats": number }],
            "lunch": [{ "name": "string", "calories": number, "protein": number, "carbs": number, "fats": number }],
            "snacks": [{ "name": "string", "calories": number, "protein": number, "carbs": number, "fats": number }],
            "dinner": [{ "name": "string", "calories": number, "protein": number, "carbs": number, "fats": number }]
          }
        }
      `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            const aiData = JSON.parse(text);

            if (!aiData || !aiData.calories || !aiData.meals) {
                throw new Error("Could not generate a complete plan. Please check your inputs.");
            }

            const processMeals = (meals: Meal[], type: string) => {
                if (!meals || !Array.isArray(meals)) return [];
                return meals.map((m: Meal) => ({
                    ...m,
                    id: Math.random(),
                    image: getPlaceholderImage(type, formData.dietPreference)
                }));
            };

            const finalPlan: FullPlan = {
                id: Date.now().toString(),
                date: new Date().toLocaleDateString(),
                calories: aiData.calories,
                macros: aiData.macros || { protein: 30, carbs: 40, fats: 30 },
                goals: formData.goal,
                description: aiData.description,
                dietPreference: formData.dietPreference,
                meals: {
                    breakfast: processMeals(aiData.meals.breakfast, 'breakfast'),
                    lunch: processMeals(aiData.meals.lunch, 'lunch'),
                    snacks: processMeals(aiData.meals.snacks, 'snacks'),
                    dinner: processMeals(aiData.meals.dinner, 'dinner')
                }
            };

            setGeneratedPlan(finalPlan);

        } catch (err: unknown) {
            console.error(err);
            setError("Failed to generate plan. Please try again later.");
        } finally {
            setIsGenerating(false);
        }
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
        const key = `${type}_${preference === 'veg' ? 'veg' : 'nonveg'}`;
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
        <div className="space-y-8 pb-12 animate-in fade-in duration-500">
            {/* Header Block */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 text-indigo-600 font-bold uppercase tracking-widest text-[9px] mb-2">
                        <BrainCircuit className="h-3.5 w-3.5" /> AI Meal Planner
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none flex items-center gap-4">
                        Diet Plans
                        <span className="px-3 py-1 bg-indigo-500 text-white text-[9px] font-bold uppercase tracking-widest rounded-full shadow-md">
                            AI Powered
                        </span>
                    </h1>
                    <p className="text-slate-500 mt-2 text-base font-medium max-w-xl">Generate a personalized South Indian diet plan based on your info.</p>
                </div>

                <div className="flex bg-slate-100 p-1 rounded-2xl shadow-inner">
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
                        Saved Plans
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
                                <h2 className="text-lg font-bold text-slate-900 tracking-tight">Your Details</h2>
                            </div>

                            <form className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Gender</label>
                                        <select
                                            name="gender"
                                            value={formData.gender}
                                            onChange={handleInputChange}
                                            className="w-full h-11 px-4 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-indigo-50 font-bold outline-none text-xs"
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
                                        className="w-full h-11 px-4 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-indigo-50 font-bold outline-none text-xs"
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
                                    onClick={generateWithGemini}
                                    disabled={isGenerating}
                                    className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 shadow-xl shadow-slate-200 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                                >
                                    {isGenerating ? (
                                        <>
                                            <div className="h-4 w-4 border-2 border-white border-t-transparent animate-spin rounded-full" />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="h-4 w-4 text-indigo-400" />
                                            Generate Diet Plan
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
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 italic">Total Daily Calories</p>
                                            <div className="flex items-baseline gap-3 mb-6">
                                                <h3 className="text-5xl font-black tracking-tighter text-indigo-400">{generatedPlan.calories}</h3>
                                                <span className="text-base font-bold text-slate-500 uppercase tracking-widest italic">KCAL</span>
                                            </div>
                                            <div className="pt-6 border-t border-white/5">
                                                <p className="text-base font-medium text-slate-300 leading-relaxed italic max-w-2xl">
                                                    "{generatedPlan.description}"
                                                </p>
                                            </div>
                                        </div>
                                    </Card>

                                    <Card className="p-8 bg-white border-0 rounded-[32px] shadow-xl shadow-slate-100 flex flex-col justify-center">
                                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 text-center">Macros</h3>
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
                                        Meal Plan <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                    </h3>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={savePlan}
                                            className="h-11 px-6 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-md"
                                        >
                                            Save Plan
                                        </button>
                                        <button
                                            onClick={() => window.print()}
                                            className="h-11 px-6 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg flex items-center gap-2"
                                        >
                                            Download PDF <ArrowRight className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Meal Matrix */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {[
                                        { title: 'Breakfast', icon: Apple, meals: generatedPlan.meals.breakfast, color: 'text-rose-500' },
                                        { title: 'Lunch', icon: Utensils, meals: generatedPlan.meals.lunch, color: 'text-indigo-500' },
                                        { title: 'Snacks', icon: Droplets, meals: generatedPlan.meals.snacks, color: 'text-amber-500' },
                                        { title: 'Dinner', icon: ChefHat, meals: generatedPlan.meals.dinner, color: 'text-slate-900' }
                                    ].map((section, idx) => (
                                        <Card key={idx} className="overflow-hidden rounded-[32px] border-0 shadow-xl shadow-slate-100 bg-white">
                                            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={`h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center ${section.color}`}>
                                                        <section.icon className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-base font-black text-slate-900 tracking-tight leading-none">{section.title}</h4>
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Meal Type</p>
                                                    </div>
                                                </div>
                                                <div className="px-3 py-1 bg-slate-900 rounded-full text-[9px] font-bold text-white tracking-widest">
                                                    {section.meals.reduce((acc, m) => acc + m.calories, 0)} KCAL
                                                </div>
                                            </div>
                                            <div className="divide-y divide-slate-50">
                                                {section.meals.map((meal) => (
                                                    <div key={meal.id} className="p-6 flex items-center gap-6 group hover:bg-slate-50 transition-colors">
                                                        <div className="h-20 w-20 rounded-2xl overflow-hidden shadow-md group-hover:scale-105 transition-transform duration-500">
                                                            <img src={meal.image} alt={meal.name} className="h-full w-full object-cover" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <h4 className="text-lg font-black text-slate-900 tracking-tight">{meal.name}</h4>
                                                            <div className="grid grid-cols-4 gap-2 mt-4">
                                                                <div className="bg-indigo-50 px-2 py-1.5 rounded-lg text-center">
                                                                    <p className="text-[7px] font-bold text-indigo-400 uppercase">Pro</p>
                                                                    <p className="text-xs font-bold text-indigo-600">{meal.protein}g</p>
                                                                </div>
                                                                <div className="bg-emerald-50 px-2 py-1.5 rounded-lg text-center">
                                                                    <p className="text-[7px] font-bold text-emerald-400 uppercase">Carb</p>
                                                                    <p className="text-xs font-bold text-emerald-600">{meal.carbs}g</p>
                                                                </div>
                                                                <div className="bg-amber-50 px-2 py-1.5 rounded-lg text-center">
                                                                    <p className="text-[7px] font-bold text-amber-400 uppercase">Fat</p>
                                                                    <p className="text-xs font-bold text-amber-600">{meal.fats}g</p>
                                                                </div>
                                                                <div className="bg-slate-900 px-2 py-1.5 rounded-lg text-center">
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
                            <div className="h-full min-h-[400px] flex flex-col items-center justify-center p-12 bg-white shadow-xl shadow-slate-50 rounded-[32px] border-2 border-dashed border-slate-100">
                                <div className="h-20 w-20 bg-indigo-50 rounded-[24px] flex items-center justify-center mb-6">
                                    <Sparkles className="h-10 w-10 text-indigo-400" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">Generate Your Plan</h3>
                                <p className="text-slate-400 text-base font-medium max-w-sm mx-auto text-center italic leading-relaxed">
                                    Fill in your details on the left and click "Generate Diet Plan" to see your personalized meal strategy.
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
                                        {plan.calories} <span className="text-lg font-black text-slate-400">kcal</span>
                                    </h3>
                                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest flex items-center italic mb-8">
                                        <ChefHat className="h-3.5 w-3.5 mr-1.5" />
                                        {plan.dietPreference === 'veg' ? 'Veg Diet' : 'Non-Veg Diet'}
                                    </p>

                                    <div className="grid grid-cols-3 gap-3 mb-6">
                                        <div className="text-center p-3 bg-slate-50 rounded-2xl group-hover:bg-indigo-50 transition-colors">
                                            <p className="text-[8px] font-bold text-slate-400 uppercase">Pro</p>
                                            <p className="text-base font-black text-indigo-600">{plan.macros.protein}%</p>
                                        </div>
                                        <div className="text-center p-3 bg-slate-50 rounded-2xl group-hover:bg-emerald-50 transition-colors">
                                            <p className="text-[8px] font-bold text-slate-400 uppercase">Carb</p>
                                            <p className="text-base font-black text-emerald-600">{plan.macros.carbs}%</p>
                                        </div>
                                        <div className="text-center p-3 bg-slate-50 rounded-2xl group-hover:bg-amber-50 transition-colors">
                                            <p className="text-[8px] font-bold text-slate-400 uppercase">Fat</p>
                                            <p className="text-base font-black text-amber-600">{plan.macros.fats}%</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                                    <button onClick={() => loadPlan(plan)} className="text-[10px] font-black text-slate-900 hover:text-indigo-600 transition-colors uppercase tracking-widest">
                                        View Plan
                                    </button>
                                    <button onClick={(e) => deletePlan(plan.id, e)} className="p-2.5 bg-white text-slate-400 hover:text-rose-600 rounded-xl shadow-sm transition-all">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </Card>
                        ))
                    ) : (
                        <Card className="col-span-full py-24 text-center rounded-[48px] border-4 border-dashed border-slate-100 flex flex-col items-center">
                            <History className="h-16 w-16 text-slate-100 mb-6" />
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">No Saved Plans</h3>
                            <p className="text-slate-400 max-w-sm mt-2 text-sm font-medium">Generate a plan to save it here.</p>
                            <Button variant="outline" className="mt-8 rounded-xl h-10 px-6 text-xs h-10" onClick={() => setActiveTab('generator')}>Return to Generator</Button>
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
};

export default DietPlans;

import React, { useState, useEffect } from 'react';
import {
    Utensils,
    Apple,
    Calculator,
    ChevronRight,
    Target,
    Scale,
    Activity,
    Flame,
    ChefHat,
    ArrowRight,
    Droplets,
    Egg,
    Leaf,
    Save,
    Trash2,
    Calendar,
    Sparkles,
    AlertCircle
} from 'lucide-react';
import { Card } from '../components';
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

// Hardcoded API Key as requested
const GEMINI_API_KEY = "AIzaSyDgddmt_xokBX3vuVyYv1gweEBSkKd0nWg";

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
        alert('Plan saved successfully!');
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
            const model = genAI.getGenerativeModel({ model: "gemini-pro" });

            const prompt = `
        You are an expert nutritionist specializing in South Indian cuisine.
        Generate a detailed 1-day diet plan for a user with these stats:
        Age: ${formData.age}, Gender: ${formData.gender}, Height: ${formData.height}cm, Weight: ${formData.weight}kg.
        Activity Level Multiplier: ${formData.activityLevel}.
        Goal: ${formData.goal}.
        Diet Preference: ${formData.dietPreference} (Strictly South Indian dishes).
        
        Calculate their TDEE and target calories for the goal properly.
        
        Return ONLY valid JSON (no markdown formatting) with this exact structure:
        {
          "calories": number (total daily target),
          "macros": { "protein": number, "carbs": number, "fats": number } (percentage distribution),
          "description": "string (brief summary of why this plan works)",
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

            // Clean up markdown if present
            const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const aiData = JSON.parse(jsonString);

            // Add IDs and Images to meals
            const processMeals = (meals: any[], type: string) => {
                return meals.map((m: any, i: number) => ({
                    ...m,
                    id: i + 1,
                    image: getPlaceholderImage(type, formData.dietPreference)
                }));
            };

            const finalPlan: FullPlan = {
                id: Date.now().toString(),
                date: new Date().toLocaleDateString(),
                calories: aiData.calories,
                macros: aiData.macros,
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

        } catch (err) {
            console.error("Gemini API Error:", err);
            setError("Failed to generate plan. Please check your internet connection or try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    const getPlaceholderImage = (type: string, preference: string) => {
        // Curated high-quality images for South Indian context
        const images: Record<string, string> = {
            breakfast_veg: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&q=80&w=200',
            breakfast_nonveg: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&q=80&w=200', // Chicken dosa/curry
            lunch_veg: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=200',
            lunch_nonveg: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&q=80&w=200', // Biryani
            snacks: 'https://images.unsplash.com/photo-1596450523265-27a909404283?auto=format&fit=crop&q=80&w=200',
            dinner: 'https://images.unsplash.com/photo-1626202168236-47a743b17730?auto=format&fit=crop&q=80&w=200'
        };

        if (type === 'snacks') return images.snacks;
        if (type === 'dinner') return images.dinner;

        // Simplification: Egg maps to non-veg image styles or veg depending on context, using veg for now for cleaner look or specific if needed
        const key = `${type}_${preference === 'veg' ? 'veg' : 'nonveg'}`;
        return images[key] || images.lunch_veg;
    };

    const MacroChart = ({ protein, carbs, fats }: MacroDistribution) => {
        const data = [
            { name: 'Protein', value: protein, color: '#3B82F6' },
            { name: 'Carbs', value: carbs, color: '#10B981' },
            { name: 'Fats', value: fats, color: '#F59E0B' },
        ];

        return (
            <div className="h-48 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
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
                        <span className="text-sm text-gray-500 block">Split</span>
                        <span className="font-bold text-gray-900">Macros</span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                        Diet Plan Generator
                        <span className="ml-3 px-3 py-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold rounded-full flex items-center shadow-sm">
                            <Sparkles className="h-3 w-3 mr-1" />
                            AI Powered
                        </span>
                    </h1>
                    <p className="text-gray-600">Create personalized South Indian nutrition strategies with Gemini</p>
                </div>
                <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-lg">
                    <button
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'generator' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                        onClick={() => setActiveTab('generator')}
                    >
                        Generator
                    </button>
                    <button
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'my-plans' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                        onClick={() => setActiveTab('my-plans')}
                    >
                        Saved Plans
                    </button>
                </div>
            </div>

            {activeTab === 'generator' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Input Form */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-bold text-gray-900 flex items-center">
                                    <Calculator className="h-5 w-5 mr-2 text-blue-600" />
                                    Details & Goals
                                </h2>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                                        <select
                                            name="gender"
                                            value={formData.gender}
                                            onChange={handleInputChange}
                                            className="w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                                        <input
                                            type="number"
                                            name="age"
                                            value={formData.age}
                                            onChange={handleInputChange}
                                            placeholder="25"
                                            className="w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
                                        <input
                                            type="number"
                                            name="height"
                                            value={formData.height}
                                            onChange={handleInputChange}
                                            placeholder="175"
                                            className="w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                                        <input
                                            type="number"
                                            name="weight"
                                            value={formData.weight}
                                            onChange={handleInputChange}
                                            placeholder="70"
                                            className="w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Activity Level</label>
                                    <select
                                        name="activityLevel"
                                        value={formData.activityLevel}
                                        onChange={handleInputChange}
                                        className="w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="1.2">Sedentary (Office job)</option>
                                        <option value="1.375">Light Exercise (1-2 days/week)</option>
                                        <option value="1.55">Moderate Exercise (3-5 days/week)</option>
                                        <option value="1.725">Heavy Exercise (6-7 days/week)</option>
                                        <option value="1.9">Athlete (2x per day)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Diet Preference</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { id: 'veg', label: 'Veg', icon: Leaf },
                                            { id: 'eggitarian', label: 'Egg', icon: Egg },
                                            { id: 'non-veg', label: 'Non-Veg', icon: Utensils },
                                        ].map((type) => (
                                            <button
                                                key={type.id}
                                                onClick={() => setFormData({ ...formData, dietPreference: type.id })}
                                                className={`flex flex-col items-center justify-center p-2 rounded-lg border text-xs font-medium transition-all ${formData.dietPreference === type.id
                                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                    : 'border-gray-200 hover:border-blue-200 hover:bg-gray-50'
                                                    }`}
                                            >
                                                <type.icon className="h-4 w-4 mb-1" />
                                                {type.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Goal</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { id: 'fat-loss', label: 'Fat Loss', icon: Flame },
                                            { id: 'muscle-gain', label: 'Build Muscle', icon: Scale },
                                            { id: 'maintenance', label: 'Body Fit', icon: Activity },
                                            { id: 'keto', label: 'Ketogenic', icon: Droplets },
                                        ].map((goal) => (
                                            <button
                                                key={goal.id}
                                                onClick={() => setFormData({ ...formData, goal: goal.id })}
                                                className={`flex items-center justify-center p-3 rounded-lg border text-sm font-medium transition-all ${formData.goal === goal.id
                                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                    : 'border-gray-200 hover:border-blue-200 hover:bg-gray-50'
                                                    }`}
                                            >
                                                <goal.icon className="h-4 w-4 mr-2" />
                                                {goal.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {error && (
                                    <div className="bg-red-50 text-red-600 text-xs p-3 rounded-lg flex items-start">
                                        <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0 mt-0.5" />
                                        {error}
                                    </div>
                                )}

                                <button
                                    onClick={generateWithGemini}
                                    disabled={isGenerating}
                                    className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-lg font-medium flex items-center justify-center transition-all shadow-lg shadow-slate-900/20 disabled:opacity-70"
                                >
                                    {isGenerating ? (
                                        <>
                                            <Sparkles className="animate-spin h-5 w-5 mr-2" />
                                            Consulting Gemini AI...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="h-5 w-5 mr-2 text-yellow-400" />
                                            Generate AI Plan
                                        </>
                                    )}
                                </button>
                            </div>
                        </Card>

                        {/* Tips Card */}
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
                            <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
                                <Utensils className="h-4 w-4 mr-2" />
                                Did you know?
                            </h3>
                            <p className="text-sm text-blue-800">
                                AI can customize macros down to the gram! Ensure you double-check ingredients for allergens.
                            </p>
                        </div>
                    </div>

                    {/* Results Area */}
                    <div className="lg:col-span-2 space-y-6">
                        {generatedPlan ? (
                            <div className="animate-fade-in space-y-6">
                                {/* Macro Summary */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Card className="p-6 bg-gradient-to-br from-slate-900 to-slate-800 text-white border-0">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-slate-400 text-sm font-medium mb-1">Daily Target</p>
                                                <h3 className="text-4xl font-bold mb-2">{generatedPlan.calories}</h3>
                                                <p className="text-slate-400 text-xs uppercase tracking-wider">Calories / Day</p>
                                            </div>
                                            <div className="p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                                                <Target className="h-8 w-8 text-blue-400" />
                                            </div>
                                        </div>
                                        <div className="mt-8 pt-6 border-t border-white/10">
                                            <p className="text-sm text-slate-300 leading-relaxed">
                                                {generatedPlan.description}
                                            </p>
                                        </div>
                                    </Card>

                                    <Card className="p-6">
                                        <h3 className="font-semibold text-gray-900 mb-4">Macro Distribution</h3>
                                        <div className="flex items-center">
                                            <div className="w-1/2">
                                                <MacroChart {...generatedPlan.macros} />
                                            </div>
                                            <div className="w-1/2 space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center">
                                                        <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                                                        <span className="text-sm text-gray-600">Protein</span>
                                                    </div>
                                                    <span className="font-bold text-gray-900">{generatedPlan.macros.protein}%</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center">
                                                        <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                                                        <span className="text-sm text-gray-600">Carbs</span>
                                                    </div>
                                                    <span className="font-bold text-gray-900">{generatedPlan.macros.carbs}%</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center">
                                                        <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                                                        <span className="text-sm text-gray-600">Fats</span>
                                                    </div>
                                                    <span className="font-bold text-gray-900">{generatedPlan.macros.fats}%</span>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-bold text-gray-900">Recommended Daily Meal Plan</h3>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={savePlan}
                                            className="flex items-center px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                                        >
                                            <Save className="h-4 w-4 mr-2" />
                                            Save Plan
                                        </button>
                                        <button
                                            onClick={() => window.print()}
                                            className="text-sm text-gray-600 font-medium hover:text-gray-900 flex items-center px-3"
                                        >
                                            Download PDF <ArrowRight className="h-4 w-4 ml-1" />
                                        </button>
                                    </div>
                                </div>

                                {/* Meal Plan List */}
                                <div className="space-y-4">
                                    {[
                                        { title: 'Breakfast', icon: Apple, meals: generatedPlan.meals.breakfast },
                                        { title: 'Lunch', icon: Utensils, meals: generatedPlan.meals.lunch },
                                        { title: 'Snack', icon: Apple, meals: generatedPlan.meals.snacks },
                                        { title: 'Dinner', icon: Utensils, meals: generatedPlan.meals.dinner }
                                    ].map((section, idx) => (
                                        <Card key={idx} className="overflow-hidden">
                                            <div className="bg-gray-50 px-6 py-3 border-b border-gray-100 flex items-center justify-between">
                                                <div className="flex items-center font-semibold text-gray-800">
                                                    <section.icon className="h-4 w-4 mr-2 text-gray-500" />
                                                    {section.title}
                                                </div>
                                                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                                    {section.meals.reduce((acc, m) => acc + m.calories, 0)} kcal
                                                </div>
                                            </div>
                                            <div className="divide-y divide-gray-100">
                                                {section.meals.map((meal) => (
                                                    <div key={meal.id} className="p-4 flex items-center hover:bg-gray-50 transition-colors">
                                                        <img
                                                            src={meal.image}
                                                            alt={meal.name}
                                                            className="h-16 w-16 rounded-lg object-cover shadow-sm"
                                                        />
                                                        <div className="ml-4 flex-1">
                                                            <h4 className="font-medium text-gray-900">{meal.name}</h4>
                                                            <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                                                                <span className="flex items-center text-blue-600 font-medium">
                                                                    <Flame className="h-3 w-3 mr-1" />
                                                                    {meal.calories} kcal
                                                                </span>
                                                                <span>P: {meal.protein}g</span>
                                                                <span>C: {meal.carbs}g</span>
                                                                <span>F: {meal.fats}g</span>
                                                            </div>
                                                        </div>
                                                        <button className="p-2 text-gray-400 hover:text-blue-600 rounded-full hover:bg-blue-50 transition-colors">
                                                            <ChevronRight className="h-5 w-5" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 bg-white border-2 border-dashed border-gray-200 rounded-xl">
                                <div className="h-20 w-20 bg-blue-50 rounded-full flex items-center justify-center mb-6 shadow-sm">
                                    <Sparkles className="h-10 w-10 text-blue-600" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Ready to Generate Your AI Nutrition Plan?</h3>
                                <p className="text-gray-500 max-w-md mx-auto mb-8">
                                    Enter your stats and let Gemini AI create a scientifically calculated, South Indian meal plan just for you.
                                </p>
                                <div className="flex space-x-8 text-left text-sm text-gray-500">
                                    <div className="flex items-center">
                                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 mr-3 font-bold">1</div>
                                        <span>Enter<br />Stats</span>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 mr-3 font-bold">2</div>
                                        <span>AI<br />Analysis</span>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 mr-3 font-bold">3</div>
                                        <span>Get AI<br />Menu</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                /* Saved Plans Tab */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {savedPlans.length > 0 ? (
                        savedPlans.map((plan) => (
                            <Card key={plan.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className={`px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wide
                      ${plan.goals === 'fat-loss' ? 'bg-orange-100 text-orange-700' :
                                                plan.goals === 'muscle-gain' ? 'bg-blue-100 text-blue-700' :
                                                    plan.goals === 'keto' ? 'bg-purple-100 text-purple-700' :
                                                        'bg-green-100 text-green-700'}`}>
                                            {plan.goals.replace('-', ' ')}
                                        </div>
                                        <span className="text-xs text-gray-500 flex items-center">
                                            <Calendar className="h-3 w-3 mr-1" />
                                            {plan.date}
                                        </span>
                                    </div>

                                    <h3 className="text-2xl font-bold text-gray-900 mb-1">
                                        {plan.calories} <span className="text-sm font-normal text-gray-500">kcal/day</span>
                                    </h3>
                                    <div className="text-sm text-gray-500 mb-6 flex items-center">
                                        <Utensils className="h-3 w-3 mr-1" />
                                        {plan.dietPreference === 'veg' ? 'Vegetarian' : plan.dietPreference === 'eggitarian' ? 'Eggitarian' : 'Non-Vegetarian'}
                                    </div>

                                    <div className="grid grid-cols-3 gap-2 mb-6">
                                        <div className="text-center p-2 bg-gray-50 rounded-lg">
                                            <div className="text-xs text-gray-500">Protein</div>
                                            <div className="font-semibold text-blue-600">{plan.macros.protein}%</div>
                                        </div>
                                        <div className="text-center p-2 bg-gray-50 rounded-lg">
                                            <div className="text-xs text-gray-500">Carbs</div>
                                            <div className="font-semibold text-green-600">{plan.macros.carbs}%</div>
                                        </div>
                                        <div className="text-center p-2 bg-gray-50 rounded-lg">
                                            <div className="text-xs text-gray-500">Fats</div>
                                            <div className="font-semibold text-yellow-600">{plan.macros.fats}%</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                        <button
                                            onClick={() => loadPlan(plan)}
                                            className="text-sm font-medium text-slate-900 hover:text-blue-600 transition-colors"
                                        >
                                            View Details
                                        </button>
                                        <button
                                            onClick={(e) => deletePlan(plan.id, e)}
                                            className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50 transition-colors"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </Card>
                        ))
                    ) : (
                        <div className="col-span-full py-12 text-center text-gray-500">
                            <div className="mx-auto h-12 w-12 text-gray-400 mb-3">
                                <Sparkles className="h-12 w-12" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900">No saved plans</h3>
                            <p>Generate an AI plan and click save to see it here.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default DietPlans;

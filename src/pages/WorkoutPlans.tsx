import React, { useState } from 'react';
import {
    Plus,
    Search,
    Filter,
    Edit,
    Trash2,
    Eye,
    Dumbbell,
    Clock,
    Calendar,
    Users,
    Target,
    ChevronDown,
    ChevronUp,
    Copy
} from 'lucide-react';

interface Exercise {
    name: string;
    sets: number;
    reps: string;
    rest: string;
    notes?: string;
}

interface WorkoutDay {
    day: string;
    focus: string;
    exercises: Exercise[];
}

interface WorkoutPlan {
    id: number;
    name: string;
    description: string;
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
    duration: string;
    frequency: string;
    goal: string;
    createdBy: string;
    assignedMembers: number;
    days: WorkoutDay[];
    createdAt: string;
}

const WorkoutPlans: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFilter, setSelectedFilter] = useState('all');
    const [expandedPlan, setExpandedPlan] = useState<number | null>(null);

    const workoutPlans: WorkoutPlan[] = [
        {
            id: 1,
            name: 'Beginner Full Body',
            description: 'Perfect for those just starting their fitness journey. Focus on building foundational strength.',
            difficulty: 'Beginner',
            duration: '4 weeks',
            frequency: '3 days/week',
            goal: 'Build Foundation',
            createdBy: 'Mike Chen',
            assignedMembers: 45,
            createdAt: '2024-12-01',
            days: [
                {
                    day: 'Day 1',
                    focus: 'Upper Body',
                    exercises: [
                        { name: 'Push-ups', sets: 3, reps: '10-12', rest: '60s' },
                        { name: 'Dumbbell Rows', sets: 3, reps: '10-12', rest: '60s' },
                        { name: 'Shoulder Press', sets: 3, reps: '10-12', rest: '60s' },
                        { name: 'Bicep Curls', sets: 3, reps: '12-15', rest: '45s' },
                    ],
                },
                {
                    day: 'Day 2',
                    focus: 'Lower Body',
                    exercises: [
                        { name: 'Squats', sets: 3, reps: '12-15', rest: '60s' },
                        { name: 'Lunges', sets: 3, reps: '10 each', rest: '60s' },
                        { name: 'Leg Press', sets: 3, reps: '12-15', rest: '60s' },
                        { name: 'Calf Raises', sets: 3, reps: '15-20', rest: '45s' },
                    ],
                },
                {
                    day: 'Day 3',
                    focus: 'Core & Cardio',
                    exercises: [
                        { name: 'Plank', sets: 3, reps: '30-45s', rest: '45s' },
                        { name: 'Russian Twists', sets: 3, reps: '20 total', rest: '45s' },
                        { name: 'Mountain Climbers', sets: 3, reps: '30s', rest: '30s' },
                        { name: 'Treadmill', sets: 1, reps: '15 min', rest: '-', notes: 'Moderate pace' },
                    ],
                },
            ],
        },
        {
            id: 2,
            name: 'Muscle Building Program',
            description: 'Designed for intermediate lifters looking to add lean muscle mass with progressive overload.',
            difficulty: 'Intermediate',
            duration: '8 weeks',
            frequency: '5 days/week',
            goal: 'Muscle Gain',
            createdBy: 'David Rodriguez',
            assignedMembers: 32,
            createdAt: '2024-11-15',
            days: [
                {
                    day: 'Day 1',
                    focus: 'Chest & Triceps',
                    exercises: [
                        { name: 'Bench Press', sets: 4, reps: '8-10', rest: '90s' },
                        { name: 'Incline Dumbbell Press', sets: 4, reps: '10-12', rest: '75s' },
                        { name: 'Cable Flyes', sets: 3, reps: '12-15', rest: '60s' },
                        { name: 'Tricep Dips', sets: 3, reps: '10-12', rest: '60s' },
                        { name: 'Tricep Pushdowns', sets: 3, reps: '12-15', rest: '45s' },
                    ],
                },
                {
                    day: 'Day 2',
                    focus: 'Back & Biceps',
                    exercises: [
                        { name: 'Deadlifts', sets: 4, reps: '6-8', rest: '120s', notes: 'Focus on form' },
                        { name: 'Pull-ups', sets: 4, reps: '8-10', rest: '90s' },
                        { name: 'Barbell Rows', sets: 4, reps: '10-12', rest: '75s' },
                        { name: 'Hammer Curls', sets: 3, reps: '12-15', rest: '45s' },
                    ],
                },
            ],
        },
        {
            id: 3,
            name: 'Fat Loss HIIT',
            description: 'High-intensity interval training designed for maximum calorie burn and fat loss.',
            difficulty: 'Intermediate',
            duration: '6 weeks',
            frequency: '4 days/week',
            goal: 'Fat Loss',
            createdBy: 'Sarah Wilson',
            assignedMembers: 58,
            createdAt: '2024-12-10',
            days: [
                {
                    day: 'Day 1',
                    focus: 'Full Body HIIT',
                    exercises: [
                        { name: 'Burpees', sets: 4, reps: '30s work/15s rest', rest: '60s between sets' },
                        { name: 'Jump Squats', sets: 4, reps: '30s work/15s rest', rest: '60s between sets' },
                        { name: 'Mountain Climbers', sets: 4, reps: '30s work/15s rest', rest: '60s between sets' },
                        { name: 'High Knees', sets: 4, reps: '30s work/15s rest', rest: '60s between sets' },
                    ],
                },
            ],
        },
        {
            id: 4,
            name: 'Strength & Power',
            description: 'Advanced program focusing on building maximal strength using compound movements.',
            difficulty: 'Advanced',
            duration: '12 weeks',
            frequency: '4 days/week',
            goal: 'Strength',
            createdBy: 'David Rodriguez',
            assignedMembers: 18,
            createdAt: '2024-10-20',
            days: [
                {
                    day: 'Day 1',
                    focus: 'Heavy Squat Day',
                    exercises: [
                        { name: 'Back Squats', sets: 5, reps: '5', rest: '180s', notes: '85-90% 1RM' },
                        { name: 'Front Squats', sets: 3, reps: '6-8', rest: '120s' },
                        { name: 'Leg Press', sets: 3, reps: '10-12', rest: '90s' },
                        { name: 'Walking Lunges', sets: 3, reps: '12 each', rest: '60s' },
                    ],
                },
            ],
        },
    ];

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'Beginner':
                return 'bg-green-100 text-green-800';
            case 'Intermediate':
                return 'bg-yellow-100 text-yellow-800';
            case 'Advanced':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getGoalColor = (goal: string) => {
        switch (goal) {
            case 'Build Foundation':
                return 'bg-blue-100 text-blue-800';
            case 'Muscle Gain':
                return 'bg-purple-100 text-purple-800';
            case 'Fat Loss':
                return 'bg-orange-100 text-orange-800';
            case 'Strength':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const filteredPlans = workoutPlans.filter(plan => {
        const matchesSearch = plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            plan.createdBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
            plan.goal.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = selectedFilter === 'all' || plan.difficulty.toLowerCase() === selectedFilter;
        return matchesSearch && matchesFilter;
    });

    const stats = {
        totalPlans: workoutPlans.length,
        totalAssigned: workoutPlans.reduce((sum, p) => sum + p.assignedMembers, 0),
        mostPopular: 'Fat Loss HIIT',
        activePlans: workoutPlans.length,
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Workout Plans</h1>
                    <p className="text-gray-600">Create and manage workout programs for members</p>
                </div>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200">
                    <Plus className="h-5 w-5" />
                    <span>Create Plan</span>
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Total Plans</p>
                            <h3 className="text-2xl font-bold text-gray-900">{stats.totalPlans}</h3>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <Dumbbell className="h-6 w-6 text-blue-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Members Assigned</p>
                            <h3 className="text-2xl font-bold text-gray-900">{stats.totalAssigned}</h3>
                        </div>
                        <div className="p-3 bg-green-100 rounded-lg">
                            <Users className="h-6 w-6 text-green-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Most Popular</p>
                            <h3 className="text-lg font-bold text-gray-900">{stats.mostPopular}</h3>
                        </div>
                        <div className="p-3 bg-purple-100 rounded-lg">
                            <Target className="h-6 w-6 text-purple-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Active Plans</p>
                            <h3 className="text-2xl font-bold text-gray-900">{stats.activePlans}</h3>
                        </div>
                        <div className="p-3 bg-orange-100 rounded-lg">
                            <Calendar className="h-6 w-6 text-orange-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                            <input
                                type="text"
                                placeholder="Search plans by name, trainer, or goal..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                            <Filter className="h-5 w-5 text-gray-400" />
                            <select
                                value={selectedFilter}
                                onChange={(e) => setSelectedFilter(e.target.value)}
                                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="all">All Difficulty</option>
                                <option value="beginner">Beginner</option>
                                <option value="intermediate">Intermediate</option>
                                <option value="advanced">Advanced</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Workout Plans */}
            <div className="space-y-4">
                {filteredPlans.map((plan) => (
                    <div key={plan.id} className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
                        {/* Plan Header */}
                        <div
                            className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => setExpandedPlan(expandedPlan === plan.id ? null : plan.id)}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-4">
                                    <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                                        <Dumbbell className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                                        <p className="text-sm text-gray-600 mt-1">{plan.description}</p>
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDifficultyColor(plan.difficulty)}`}>
                                                {plan.difficulty}
                                            </span>
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getGoalColor(plan.goal)}`}>
                                                {plan.goal}
                                            </span>
                                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full">
                                                <Clock className="h-3 w-3 mr-1" />
                                                {plan.duration}
                                            </span>
                                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full">
                                                <Calendar className="h-3 w-3 mr-1" />
                                                {plan.frequency}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <div className="text-right">
                                        <p className="text-sm text-gray-600">Created by</p>
                                        <p className="text-sm font-medium text-gray-900">{plan.createdBy}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-600">Assigned</p>
                                        <p className="text-sm font-medium text-blue-600">{plan.assignedMembers} members</p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                            <Eye className="h-4 w-4" />
                                        </button>
                                        <button className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                                            <Copy className="h-4 w-4" />
                                        </button>
                                        <button className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
                                            <Edit className="h-4 w-4" />
                                        </button>
                                        <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                    {expandedPlan === plan.id ? (
                                        <ChevronUp className="h-5 w-5 text-gray-400" />
                                    ) : (
                                        <ChevronDown className="h-5 w-5 text-gray-400" />
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Expanded Plan Details */}
                        {expandedPlan === plan.id && (
                            <div className="border-t border-gray-200 p-6 bg-gray-50">
                                <h4 className="text-sm font-semibold text-gray-900 mb-4">Workout Schedule</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {plan.days.map((day, dayIndex) => (
                                        <div key={dayIndex} className="bg-white rounded-lg border border-gray-200 p-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <h5 className="font-semibold text-gray-900">{day.day}</h5>
                                                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                                                    {day.focus}
                                                </span>
                                            </div>
                                            <div className="space-y-2">
                                                {day.exercises.map((exercise, exIndex) => (
                                                    <div key={exIndex} className="flex items-center justify-between text-sm py-2 border-b border-gray-100 last:border-0">
                                                        <span className="text-gray-800">{exercise.name}</span>
                                                        <span className="text-gray-500">
                                                            {exercise.sets} × {exercise.reps}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 flex justify-end space-x-3">
                                    <button className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                                        View Full Plan
                                    </button>
                                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                                        Assign to Members
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {filteredPlans.length === 0 && (
                <div className="bg-white rounded-xl shadow border border-gray-200 p-12 text-center">
                    <Dumbbell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No workout plans found</h3>
                    <p className="text-gray-600 mb-4">Try adjusting your search or filters</p>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
                        Create New Plan
                    </button>
                </div>
            )}
        </div>
    );
};

export default WorkoutPlans;

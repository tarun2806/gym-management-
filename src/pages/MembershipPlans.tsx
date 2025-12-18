import React, { useState } from 'react';
import {
    Plus,
    Edit,
    Trash2,
    Users,
    Check,
    Crown,
    Star,
    Zap,
    DollarSign,
    Calendar
} from 'lucide-react';

interface Plan {
    id: number;
    name: string;
    description: string;
    price: {
        monthly: number;
        annual: number;
    };
    features: string[];
    popular: boolean;
    color: string;
    icon: React.ElementType;
    activeMembers: number;
    maxMembers: number | null;
}

const MembershipPlans: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

    const plans: Plan[] = [
        {
            id: 1,
            name: 'Day Pass',
            description: 'Perfect for occasional visitors',
            price: {
                monthly: 15,
                annual: 15,
            },
            features: [
                'Single day access',
                'Basic equipment access',
                'Locker room access',
                'Free water bottle',
            ],
            popular: false,
            color: 'from-gray-500 to-gray-600',
            icon: Calendar,
            activeMembers: 65,
            maxMembers: null,
        },
        {
            id: 2,
            name: 'Basic',
            description: 'Great for getting started',
            price: {
                monthly: 39.99,
                annual: 399.99,
            },
            features: [
                'Full gym access',
                'Basic equipment access',
                'Locker room access',
                '2 group classes/month',
                'Fitness assessment',
            ],
            popular: false,
            color: 'from-blue-500 to-blue-600',
            icon: Users,
            activeMembers: 450,
            maxMembers: 600,
        },
        {
            id: 3,
            name: 'Premium',
            description: 'Most popular choice',
            price: {
                monthly: 79.99,
                annual: 799.99,
            },
            features: [
                'Everything in Basic',
                'Unlimited group classes',
                'Personal trainer (1 session/month)',
                'Nutrition consultation',
                'Guest passes (2/month)',
                'Priority booking',
                'Towel service',
            ],
            popular: true,
            color: 'from-purple-500 to-purple-600',
            icon: Star,
            activeMembers: 320,
            maxMembers: 400,
        },
        {
            id: 4,
            name: 'VIP',
            description: 'Ultimate gym experience',
            price: {
                monthly: 149.99,
                annual: 1499.99,
            },
            features: [
                'Everything in Premium',
                'Personal trainer (4 sessions/month)',
                'Spa & sauna access',
                'Private locker',
                'Unlimited guest passes',
                '24/7 access',
                'Complimentary supplements',
                'VIP lounge access',
                'Dedicated parking',
            ],
            popular: false,
            color: 'from-amber-500 to-amber-600',
            icon: Crown,
            activeMembers: 85,
            maxMembers: 100,
        },
    ];

    const totalMembers = plans.reduce((sum, plan) => sum + plan.activeMembers, 0);
    const totalMonthlyRevenue = plans.reduce((sum, plan) => sum + (plan.activeMembers * plan.price.monthly), 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Membership Plans</h1>
                    <p className="text-gray-600">Manage your gym's subscription tiers and pricing</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200"
                >
                    <Plus className="h-5 w-5" />
                    <span>Create Plan</span>
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Total Members</p>
                            <h3 className="text-2xl font-bold text-gray-900">{totalMembers.toLocaleString()}</h3>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <Users className="h-6 w-6 text-blue-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Monthly Revenue</p>
                            <h3 className="text-2xl font-bold text-gray-900">${totalMonthlyRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
                        </div>
                        <div className="p-3 bg-green-100 rounded-lg">
                            <DollarSign className="h-6 w-6 text-green-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Active Plans</p>
                            <h3 className="text-2xl font-bold text-gray-900">{plans.length}</h3>
                        </div>
                        <div className="p-3 bg-purple-100 rounded-lg">
                            <Zap className="h-6 w-6 text-purple-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Billing Toggle */}
            <div className="flex justify-center">
                <div className="bg-gray-100 p-1 rounded-lg inline-flex">
                    <button
                        onClick={() => setBillingCycle('monthly')}
                        className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${billingCycle === 'monthly'
                                ? 'bg-white text-gray-900 shadow'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        Monthly
                    </button>
                    <button
                        onClick={() => setBillingCycle('annual')}
                        className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${billingCycle === 'annual'
                                ? 'bg-white text-gray-900 shadow'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        Annual
                        <span className="ml-2 text-xs text-green-600 font-semibold">Save 17%</span>
                    </button>
                </div>
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {plans.map((plan) => (
                    <div
                        key={plan.id}
                        className={`relative bg-white rounded-xl shadow-lg border-2 overflow-hidden transition-transform hover:scale-105 ${plan.popular ? 'border-purple-500' : 'border-gray-200'
                            }`}
                    >
                        {plan.popular && (
                            <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-center py-1 text-sm font-medium">
                                Most Popular
                            </div>
                        )}

                        <div className={`${plan.popular ? 'pt-10' : 'pt-6'} px-6 pb-6`}>
                            {/* Plan Header */}
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-3 rounded-lg bg-gradient-to-r ${plan.color}`}>
                                    <plan.icon className="h-6 w-6 text-white" />
                                </div>
                                <div className="flex space-x-1">
                                    <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                        <Edit className="h-4 w-4" />
                                    </button>
                                    <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                            <p className="text-sm text-gray-600 mb-4">{plan.description}</p>

                            {/* Price */}
                            <div className="mb-6">
                                <div className="flex items-baseline">
                                    <span className="text-4xl font-bold text-gray-900">
                                        ${billingCycle === 'monthly' ? plan.price.monthly : plan.price.annual}
                                    </span>
                                    <span className="text-gray-600 ml-2">
                                        /{billingCycle === 'monthly' ? 'month' : 'year'}
                                    </span>
                                </div>
                                {billingCycle === 'annual' && plan.name !== 'Day Pass' && (
                                    <p className="text-sm text-green-600 mt-1">
                                        Save ${((plan.price.monthly * 12) - plan.price.annual).toFixed(2)}/year
                                    </p>
                                )}
                            </div>

                            {/* Features */}
                            <ul className="space-y-3 mb-6">
                                {plan.features.map((feature, index) => (
                                    <li key={index} className="flex items-start">
                                        <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                                        <span className="text-sm text-gray-700">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            {/* Members Progress */}
                            <div className="pt-4 border-t border-gray-200">
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-gray-600">Active Members</span>
                                    <span className="font-medium text-gray-900">
                                        {plan.activeMembers}{plan.maxMembers ? `/${plan.maxMembers}` : ''}
                                    </span>
                                </div>
                                {plan.maxMembers && (
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full bg-gradient-to-r ${plan.color}`}
                                            style={{ width: `${(plan.activeMembers / plan.maxMembers) * 100}%` }}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Plan Comparison Table */}
            <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Plan Comparison</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="text-left py-3 px-4 font-medium text-gray-600">Feature</th>
                                {plans.map((plan) => (
                                    <th key={plan.id} className="text-center py-3 px-4 font-medium text-gray-900">
                                        {plan.name}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b border-gray-100">
                                <td className="py-3 px-4 text-gray-700">Gym Access</td>
                                <td className="text-center py-3 px-4">1 Day</td>
                                <td className="text-center py-3 px-4">Standard Hours</td>
                                <td className="text-center py-3 px-4">Extended Hours</td>
                                <td className="text-center py-3 px-4">24/7</td>
                            </tr>
                            <tr className="border-b border-gray-100">
                                <td className="py-3 px-4 text-gray-700">Group Classes</td>
                                <td className="text-center py-3 px-4"><span className="text-red-500">✗</span></td>
                                <td className="text-center py-3 px-4">2/month</td>
                                <td className="text-center py-3 px-4">Unlimited</td>
                                <td className="text-center py-3 px-4">Unlimited</td>
                            </tr>
                            <tr className="border-b border-gray-100">
                                <td className="py-3 px-4 text-gray-700">Personal Training</td>
                                <td className="text-center py-3 px-4"><span className="text-red-500">✗</span></td>
                                <td className="text-center py-3 px-4"><span className="text-red-500">✗</span></td>
                                <td className="text-center py-3 px-4">1/month</td>
                                <td className="text-center py-3 px-4">4/month</td>
                            </tr>
                            <tr className="border-b border-gray-100">
                                <td className="py-3 px-4 text-gray-700">Guest Passes</td>
                                <td className="text-center py-3 px-4"><span className="text-red-500">✗</span></td>
                                <td className="text-center py-3 px-4"><span className="text-red-500">✗</span></td>
                                <td className="text-center py-3 px-4">2/month</td>
                                <td className="text-center py-3 px-4">Unlimited</td>
                            </tr>
                            <tr className="border-b border-gray-100">
                                <td className="py-3 px-4 text-gray-700">Spa & Sauna</td>
                                <td className="text-center py-3 px-4"><span className="text-red-500">✗</span></td>
                                <td className="text-center py-3 px-4"><span className="text-red-500">✗</span></td>
                                <td className="text-center py-3 px-4"><span className="text-red-500">✗</span></td>
                                <td className="text-center py-3 px-4"><span className="text-green-500">✓</span></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal placeholder */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Plan</h2>
                        <p className="text-gray-600 mb-4">Plan creation form would go here.</p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                Create Plan
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MembershipPlans;

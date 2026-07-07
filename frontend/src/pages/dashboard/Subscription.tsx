import React from 'react';
import Card from '../../components/ui/Card';

export const Subscription: React.FC = () => {
  const plans = [
    {
      name: 'Free Plan',
      price: '$0',
      period: 'forever',
      features: [
        'Access to public materials feed',
        'Create up to 2 study groups',
        'Basic whiteboard features',
        '3 AI Assistant queries per day',
      ],
      current: false,
    },
    {
      name: 'Pro Student',
      price: '$9.99',
      period: 'month',
      features: [
        'Unlimited study materials uploads',
        'Unlimited study group memberships',
        'Real-time collaborative whiteboard',
        'Unlimited AI Assistant queries',
        'HD Video & Audio meetings',
      ],
      current: true, // Marked as current plan matching our default badge
    },
    {
      name: 'Campus Link',
      price: '$49.99',
      period: 'month',
      features: [
        'All Pro Student features',
        'Priority AI response queues',
        'Shared institution folder portals',
        'Dedicated admin control panels',
        '24/7 priority customer service',
      ],
      current: false,
    },
  ];

  return (
    <div className="space-y-6">
      <section className="p-8 bg-indigo-600 text-white rounded-2xl shadow-md shadow-indigo-150">
        <h2 className="text-xl font-bold">Billing & Account Settings</h2>
        <p className="text-xs text-indigo-100 mt-1">
          Manage your membership plans, invoices, and billing schedules.
        </p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`bg-white border rounded-2xl p-6 flex flex-col justify-between shadow-sm relative overflow-hidden ${
              plan.current ? 'border-indigo-600 ring-2 ring-indigo-600/10' : 'border-gray-200'
            }`}
          >
            {plan.current && (
              <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] font-extrabold tracking-wider uppercase px-4 py-1.5 rounded-bl-xl">
                Active Plan
              </div>
            )}

            <div>
              <h3 className="font-extrabold text-gray-900 text-base mb-1">{plan.name}</h3>
              <div className="flex items-baseline gap-1 my-3">
                <span className="text-3xl font-extrabold text-gray-900">{plan.price}</span>
                <span className="text-xs text-gray-500 font-medium">/ {plan.period}</span>
              </div>
              <ul className="space-y-3 mt-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-xs text-gray-600 leading-relaxed">
                    <i className="fas fa-check text-emerald-500 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              className={`w-full py-3.5 mt-8 rounded-full text-xs font-bold transition-colors ${
                plan.current
                  ? 'bg-gray-100 text-gray-500 pointer-events-none'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {plan.current ? 'Current Plan' : 'Upgrade Plan'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
export default Subscription;

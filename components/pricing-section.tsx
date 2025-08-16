'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import { useState } from 'react';
import { useSession } from 'next-auth/react';

const plans = [
  {
    name: 'Individual',
    price: '$25',
    period: '/month',
    description: 'Perfect for individual brokers getting started',
    features: [
      'Up to 25 documents',
      'Basic AI chat',
      'Branded client links',
      'Analytics dashboard',
      'Email support',
      'Standard response time',
    ],
    cta: 'Buy Now',
    popular: false,
  },
  {
    name: 'Team',
    price: '$75',
    period: '/month',
    description: 'For growing brokerages and teams',
    features: [
      'Up to 200 documents',
      'Advanced AI chat',
      'Branded client links',
      'Analytics dashboard',
      'Priority support',
      'Team collaboration',
    ],
    cta: 'Buy Now',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For large firms with custom needs',
    features: [
      'Custom solutions',
      'Dedicated support',
      'Flexible pricing',
      'Tailored features',
    ],
    cta: 'Contact Sales',
    popular: false,
  },
];

export function PricingSection() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState<string | null>(null);

  const handleCheckout = async (planName: string) => {
    if (planName === 'Enterprise') {
      window.location.href = '/contact-sales';
      return;
    }

    // For Individual and Team plans, redirect to pre-checkout account creation
    if (planName === 'Individual' || planName === 'Team') {
      window.location.href = `/pre-checkout?plan=${planName.toLowerCase()}`;
      return;
    }

    // Fallback to registration with trial plan (shouldn't reach here)
    window.location.href = `/register?trial_plan=${planName.toLowerCase()}`;
  };

  return (
    <section id="pricing" className="py-20 px-4 bg-white">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose the plan that fits your business. Start with a 14-day free
            trial or purchase directly.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative border-0 shadow-lg hover:shadow-xl transition-shadow flex flex-col ${
                plan.popular ? 'ring-2 ring-[#38b6ff] scale-105' : ''
              }`}
            >
              {plan.popular && (
                <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-[#38b6ff] text-white px-3 py-1 text-xs">
                  Most Popular
                </Badge>
              )}

              <CardHeader className="text-center pb-4 flex-shrink-0">
                <CardTitle className="text-2xl mb-4">{plan.name}</CardTitle>
                <div className="flex items-baseline justify-center mb-4">
                  <span className="text-4xl font-bold text-gray-900">
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className="text-gray-600 ml-1">{plan.period}</span>
                  )}
                </div>
                <CardDescription className="text-gray-600">
                  {plan.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-0 flex-1 flex flex-col">
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-[#38b6ff] flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleCheckout(plan.name)}
                  disabled={loading === plan.name}
                  className={`w-full mt-auto ${
                    plan.popular
                      ? 'bg-[#38b6ff] hover:bg-[#1e40af] text-white'
                      : 'bg-gray-900 hover:bg-gray-800 text-white'
                  }`}
                >
                  {loading === plan.name ? 'Loading...' : plan.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 max-w-2xl mx-auto">
            <p className="text-blue-800 text-sm">
              💡 <strong>Want to try before you buy?</strong> You can still
              start with a 14-day free trial by going to our registration page.
            </p>
            <Link href="/register" className="inline-block mt-2">
              <Button
                variant="outline"
                size="sm"
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                Start Free Trial
              </Button>
            </Link>
          </div>

          <p className="text-gray-600 mb-4">
            Need a custom plan? Contact our sales team
          </p>
          <Link href="/contact-sales">
            <Button
              variant="outline"
              className="border-[#38b6ff] text-[#38b6ff] hover:bg-[#38b6ff] hover:text-white"
            >
              Contact Sales
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

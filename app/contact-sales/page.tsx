'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Mail, Phone, MessageSquare, ArrowLeft } from 'lucide-react';
import { toast } from '@/components/toast';

export default function ContactSalesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    message: '',
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // For now, we'll just show a success message
      // In a real implementation, you'd send this to your backend
      toast({
        type: 'success',
        description:
          "Thank you for your inquiry! We'll get back to you within 24 hours.",
      });

      // Reset form
      setFormData({
        name: '',
        email: '',
        company: '',
        message: '',
      });
    } catch (error) {
      toast({
        type: 'error',
        description: 'Failed to send message. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEmailClick = () => {
    const subject = encodeURIComponent('Enterprise Plan Inquiry');
    const body = encodeURIComponent(
      "Hello,\n\nI'm interested in learning more about your Enterprise plan.\n\nPlease provide more information about:\n- Custom solutions\n- Pricing options\n- Implementation timeline\n\nThank you!",
    );
    window.open(`mailto:support@om2chat.com?subject=${subject}&body=${body}`);
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="absolute top-4 left-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <Image
            src="/images/om2chat-logo.svg"
            alt="OM2Chat"
            width={160}
            height={40}
            className="h-12 w-auto mx-auto mb-6"
          />

          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Enterprise Solutions
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Ready to scale your business with custom AI solutions? Our
            enterprise team is here to help you build the perfect solution for
            your organization.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="w-5 h-5 mr-2" />
                Get in Touch
              </CardTitle>
              <CardDescription>
                Reach out to our enterprise sales team for custom solutions and
                dedicated support.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-sm text-gray-600">support@om2chat.com</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Phone</p>
                    <p className="text-sm text-gray-600">
                      Available upon request
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h3 className="font-semibold mb-3">What we offer:</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Custom AI model training</li>
                  <li>• White-label solutions</li>
                  <li>• Enterprise-grade security</li>
                  <li>• Dedicated account management</li>
                  <li>• Custom integrations</li>
                  <li>• 24/7 priority support</li>
                </ul>
              </div>

              <Button onClick={handleEmailClick} className="w-full">
                <Mail className="w-4 h-4 mr-2" />
                Send Email Inquiry
              </Button>
            </CardContent>
          </Card>

          {/* Contact Form */}
          <Card>
            <CardHeader>
              <CardTitle>Request Information</CardTitle>
              <CardDescription>
                Fill out the form below and we'll get back to you within 24
                hours.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter your email address"
                  />
                </div>

                <div>
                  <Label htmlFor="company">Company Name</Label>
                  <Input
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    placeholder="Enter your company name"
                  />
                </div>

                <div>
                  <Label htmlFor="message">Message *</Label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    placeholder="Tell us about your needs, expected timeline, and any specific requirements..."
                    rows={5}
                  />
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Sending...' : 'Send Message'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Additional Information */}
        <div className="mt-12 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Why Choose Enterprise?
          </h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">Custom Solutions</h3>
              <p className="text-sm text-gray-600">
                Tailored AI models and workflows designed specifically for your
                business needs.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Phone className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">Dedicated Support</h3>
              <p className="text-sm text-gray-600">
                24/7 priority support with dedicated account managers and
                technical specialists.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Mail className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">Flexible Pricing</h3>
              <p className="text-sm text-gray-600">
                Custom pricing models that scale with your business and usage
                requirements.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

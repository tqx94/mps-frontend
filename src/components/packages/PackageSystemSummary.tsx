// src/components/packages/PackageSystemSummary.tsx
'use client'

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  Star, 
  Zap, 
  Shield, 
  Users, 
  Clock,
  DollarSign,
  Award
} from 'lucide-react';

interface PackageSystemSummaryProps {
  totalPackages: number;
  userRole?: string;
  onViewPackages: () => void;
}

export const PackageSystemSummary: React.FC<PackageSystemSummaryProps> = ({
  totalPackages,
  userRole,
  onViewPackages
}) => {
  const features = [
    {
      icon: <CheckCircle className="h-6 w-6" />,
      title: 'Role-Based Packages',
      description: 'Tailored packages for Members, Tutors, and Students',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: 'Smart Recommendations',
      description: 'AI-powered package suggestions based on your needs',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: 'Secure Payments',
      description: 'Safe and encrypted payment processing',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: 'Community Access',
      description: 'Connect with like-minded professionals and students',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      icon: <Clock className="h-6 w-6" />,
      title: 'Flexible Scheduling',
      description: 'Book workspace time that fits your schedule',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    },
    {
      icon: <Award className="h-6 w-6" />,
      title: 'Premium Features',
      description: 'Access to meeting rooms, printing, and more',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    }
  ];

  const stats = [
    {
      label: 'Total Packages',
      value: totalPackages,
      icon: <DollarSign className="h-5 w-5" />
    },
    {
      label: 'Package Types',
      value: '3',
      icon: <Star className="h-5 w-5" />
    },
    {
      label: 'User Roles',
      value: '3',
      icon: <Users className="h-5 w-5" />
    },
    {
      label: 'Features',
      value: '20+',
      icon: <Zap className="h-5 w-5" />
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Enhanced Package System</h1>
        <p className="text-xl text-muted-foreground mb-6">
          A comprehensive solution for workspace package management
        </p>
        <div className="flex justify-center">
          <Badge variant="outline" className="text-lg px-4 py-2">
            {userRole} Packages Available
          </Badge>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="text-center">
            <CardContent className="p-6">
              <div className="flex items-center justify-center mb-2">
                <div className="p-2 bg-primary/10 rounded-full text-primary">
                  {stat.icon}
                </div>
              </div>
              <div className="text-2xl font-bold mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${feature.bgColor} ${feature.color} mb-4`}>
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm">{feature.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* System Capabilities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Star className="h-6 w-6 mr-2" />
            System Capabilities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-lg">Package Management</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Create, edit, and delete packages
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Role-based package filtering
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Advanced search and filtering
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Package comparison tools
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Smart recommendations
                </li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold text-lg">User Experience</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Intuitive package cards
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Real-time loading states
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Comprehensive error handling
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Mobile-responsive design
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Accessibility features
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Call to Action */}
      <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
        <CardContent className="p-8 text-center">
          <h3 className="text-2xl font-bold mb-4">Ready to Explore Packages?</h3>
          <p className="text-muted-foreground mb-6">
            Discover the perfect workspace package for your {userRole?.toLowerCase()} needs
          </p>
          <Button 
            onClick={onViewPackages}
            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-8 py-3 text-lg"
          >
            View All Packages
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

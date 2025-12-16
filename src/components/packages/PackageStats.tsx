// src/components/packages/PackageStats.tsx
'use client'

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { NewPackage } from '@/lib/services/packageService';
import { 
  Clock, 
  Users, 
  DollarSign, 
  Star, 
  TrendingUp, 
  Award,
  Calendar,
  Zap
} from 'lucide-react';

interface PackageStatsProps {
  packages: NewPackage[];
  userRole?: string;
}

export const PackageStats: React.FC<PackageStatsProps> = ({ packages, userRole }) => {
  const totalPackages = packages.length;
  const totalValue = packages.reduce((sum, pkg) => sum + pkg.price, 0);
  const averagePrice = totalPackages > 0 ? totalValue / totalPackages : 0;
  const totalHours = packages.reduce((sum, pkg) => sum + pkg.packageContents.totalHours, 0);
  
  const packageTypes = packages.reduce((acc, pkg) => {
    acc[pkg.packageType] = (acc[pkg.packageType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const mostExpensive = packages.reduce((max, pkg) => 
    pkg.price > max.price ? pkg : max, packages[0] || { price: 0, name: 'N/A' }
  );

  const cheapest = packages.reduce((min, pkg) => 
    pkg.price < min.price ? pkg : min, packages[0] || { price: Infinity, name: 'N/A' }
  );

  const packagesWithDiscount = packages.filter(pkg => 
    pkg.originalPrice && pkg.originalPrice > pkg.price
  ).length;

  const averageValidity = packages.reduce((sum, pkg) => sum + pkg.validityDays, 0) / totalPackages;

  const stats = [
    {
      title: 'Total Packages',
      value: totalPackages,
      icon: <Award className="h-5 w-5" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Total Value',
      value: `SGD ${totalValue.toFixed(0)}`,
      icon: <DollarSign className="h-5 w-5" />,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Average Price',
      value: `SGD ${averagePrice.toFixed(0)}`,
      icon: <TrendingUp className="h-5 w-5" />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Total Hours',
      value: `${totalHours} hrs`,
      icon: <Clock className="h-5 w-5" />,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: 'With Discounts',
      value: packagesWithDiscount,
      icon: <Star className="h-5 w-5" />,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    },
    {
      title: 'Avg Validity',
      value: `${averageValidity.toFixed(0)} days`,
      icon: <Calendar className="h-5 w-5" />,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">Package Statistics</h2>
        <p className="text-muted-foreground">
          Overview of {userRole} packages available
        </p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="text-center">
            <CardContent className="p-4">
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${stat.bgColor} ${stat.color} mb-3`}>
                {stat.icon}
              </div>
              <div className="text-2xl font-bold mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.title}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Package Type Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Package Type Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(packageTypes).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <Zap className="h-4 w-4 mr-2 text-orange-500" />
                  <span className="font-medium">{type.replace('_', ' ')}</span>
                </div>
                <Badge variant="secondary">{count}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Price Range */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-green-600">
              <TrendingUp className="h-5 w-5 mr-2" />
              Most Expensive
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 mb-2">
              SGD {mostExpensive.price}
            </div>
            <div className="text-sm text-muted-foreground">{mostExpensive.name}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-blue-600">
              <DollarSign className="h-5 w-5 mr-2" />
              Best Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 mb-2">
              SGD {cheapest.price}
            </div>
            <div className="text-sm text-muted-foreground">{cheapest.name}</div>
          </CardContent>
        </Card>
      </div>

      {/* Package Highlights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Star className="h-5 w-5 mr-2" />
            Package Highlights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {packages.slice(0, 3).map((pkg) => (
              <div key={pkg.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">{pkg.name}</h4>
                  <Badge variant="outline">{pkg.packageType.replace('_', ' ')}</Badge>
                </div>
                <div className="text-2xl font-bold text-primary mb-1">
                  SGD {pkg.price}
                </div>
                <div className="text-sm text-muted-foreground">
                  {pkg.packageContents.totalHours} hours • {pkg.validityDays} days
                </div>
                {pkg.originalPrice && pkg.originalPrice > pkg.price && (
                  <div className="text-xs text-green-600 mt-1">
                    Save SGD {(pkg.originalPrice - pkg.price).toFixed(0)}!
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// src/components/packages/PackageRecommendations.tsx
'use client'

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { NewPackage } from '@/lib/services/packageService';
import { 
  Star, 
  TrendingUp, 
  Clock, 
  Users, 
  Award,
  Zap,
  CheckCircle
} from 'lucide-react';

interface PackageRecommendationsProps {
  packages: NewPackage[];
  onPurchase: (pkg: NewPackage) => void;
  userRole?: string;
}

export const PackageRecommendations: React.FC<PackageRecommendationsProps> = ({
  packages,
  onPurchase,
  userRole
}) => {
  const getRecommendations = () => {
    if (packages.length === 0) return [];

    const recommendations = [];

    // Most Popular (highest total hours)
    const mostPopular = packages.reduce((max, pkg) => 
      pkg.packageContents.totalHours > max.packageContents.totalHours ? pkg : max
    );
    recommendations.push({
      type: 'Most Popular',
      package: mostPopular,
      reason: 'Highest total hours available',
      icon: <TrendingUp className="h-5 w-5" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    });

    // Best Value (lowest price per hour)
    const bestValue = packages.reduce((best, pkg) => {
      const pricePerHour = pkg.price / pkg.packageContents.totalHours;
      const bestPricePerHour = best.price / best.packageContents.totalHours;
      return pricePerHour < bestPricePerHour ? pkg : best;
    });
    recommendations.push({
      type: 'Best Value',
      package: bestValue,
      reason: 'Lowest price per hour',
      icon: <Award className="h-5 w-5" />,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    });

    // Quick Start (shortest validity)
    const quickStart = packages.reduce((shortest, pkg) => 
      pkg.validityDays < shortest.validityDays ? pkg : shortest
    );
    recommendations.push({
      type: 'Quick Start',
      package: quickStart,
      reason: 'Shortest validity period',
      icon: <Zap className="h-5 w-5" />,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    });

    // Premium Choice (most expensive but with discount)
    const premiumChoice = packages
      .filter(pkg => pkg.originalPrice && pkg.originalPrice > pkg.price)
      .reduce((premium, pkg) => 
        pkg.price > premium.price ? pkg : premium, packages[0]
      );
    
    if (premiumChoice && premiumChoice.originalPrice && premiumChoice.originalPrice > premiumChoice.price) {
      recommendations.push({
        type: 'Premium Choice',
        package: premiumChoice,
        reason: 'Premium package with discount',
        icon: <Star className="h-5 w-5" />,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50'
      });
    }

    return recommendations;
  };

  const recommendations = getRecommendations();

  if (recommendations.length === 0) return null;

  const formatPrice = (price: number) => `SGD ${price.toFixed(2)}`;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">Recommended for You</h2>
        <p className="text-muted-foreground">
          Based on your {userRole} role and package analysis
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {recommendations.map((rec, index) => (
          <Card key={index} className="relative overflow-hidden">
            {/* Recommendation Badge */}
            <div className={`absolute top-4 right-4 ${rec.bgColor} ${rec.color} p-2 rounded-full`}>
              {rec.icon}
            </div>

            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2 mb-2">
                <Badge variant="outline" className="text-xs">
                  {rec.type}
                </Badge>
              </div>
              <CardTitle className="text-lg">{rec.package.name}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {rec.reason}
              </p>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Package Details */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total Hours:</span>
                  <span className="font-semibold">{rec.package.packageContents.totalHours}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Validity:</span>
                  <span className="font-semibold">{rec.package.validityDays} days</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Type:</span>
                  <span className="font-semibold">{rec.package.packageType.replace('_', ' ')}</span>
                </div>
              </div>

              {/* Price */}
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-primary mb-1">
                  {formatPrice(rec.package.price)}
                </div>
                {rec.package.originalPrice && rec.package.originalPrice > rec.package.price && (
                  <div className="text-sm text-muted-foreground line-through">
                    {formatPrice(rec.package.originalPrice)}
                  </div>
                )}
             
              </div>

              {/* Features */}
              <div className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground mb-2">Key Features:</div>
                <div className="space-y-1">
                  {rec.package.packageContents.halfDayPasses && (
                    <div className="flex items-center text-xs">
                      <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                      {rec.package.packageContents.halfDayPasses} Half-Day Packages
                    </div>
                  )}
                  {rec.package.packageContents.fullDayPasses && (
                    <div className="flex items-center text-xs">
                      <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                      {rec.package.packageContents.fullDayPasses} Full-Day Packages
                    </div>
                  )}
                  {rec.package.packageContents.complimentaryHours && (
                    <div className="flex items-center text-xs">
                      <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                      +{rec.package.packageContents.complimentaryHours} Bonus Hours
                    </div>
                  )}
                  <div className="flex items-center text-xs">
                    <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                    High-speed WiFi
                  </div>
                  <div className="flex items-center text-xs">
                    <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                    Quiet environment
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <Button 
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                onClick={() => onPurchase(rec.package)}
              >
                Choose This Package
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Why These Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Why These Recommendations?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-blue-600">Most Popular</h4>
              <p className="text-sm text-muted-foreground">
                Offers the most total hours, perfect for heavy users who need maximum workspace time.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-green-600">Best Value</h4>
              <p className="text-sm text-muted-foreground">
                Provides the lowest cost per hour, ideal for budget-conscious users.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-orange-600">Quick Start</h4>
              <p className="text-sm text-muted-foreground">
                Shortest validity period, great for trying out the service or short-term needs.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-purple-600">Premium Choice</h4>
              <p className="text-sm text-muted-foreground">
                High-quality package with current discount, perfect for those wanting premium features.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

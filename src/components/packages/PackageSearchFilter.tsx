// src/components/packages/PackageSearchFilter.tsx
'use client'

import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { NewPackage } from '@/lib/services/packageService';
import { Search, Filter, X, SortAsc, SortDesc } from 'lucide-react';

interface PackageSearchFilterProps {
  packages: NewPackage[];
  onFilteredPackages: (filtered: NewPackage[]) => void;
  userRole?: string;
}

type SortOption = 'name' | 'price' | 'hours' | 'validity';
type SortOrder = 'asc' | 'desc';

export const PackageSearchFilter: React.FC<PackageSearchFilterProps> = ({
  packages,
  onFilteredPackages,
  userRole
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [packageType, setPackageType] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [showFilters, setShowFilters] = useState(false);

  const filteredAndSortedPackages = useMemo(() => {
    let filtered = [...packages];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(pkg =>
        pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pkg.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Package type filter
    if (packageType !== 'all') {
      filtered = filtered.filter(pkg => pkg.packageType === packageType);
    }

    // Price range filter
    if (priceRange !== 'all') {
      const [min, max] = priceRange.split('-').map(Number);
      filtered = filtered.filter(pkg => {
        if (max) {
          return pkg.price >= min && pkg.price <= max;
        } else {
          return pkg.price >= min;
        }
      });
    }

    // Sort packages
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'price':
          aValue = a.price;
          bValue = b.price;
          break;
        case 'hours':
          aValue = a.packageContents.totalHours;
          bValue = b.packageContents.totalHours;
          break;
        case 'validity':
          aValue = a.validityDays;
          bValue = b.validityDays;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [packages, searchTerm, packageType, priceRange, sortBy, sortOrder]);

  // Update parent component when filtered packages change
  React.useEffect(() => {
    onFilteredPackages(filteredAndSortedPackages);
  }, [filteredAndSortedPackages, onFilteredPackages]);

  const clearFilters = () => {
    setSearchTerm('');
    setPackageType('all');
    setPriceRange('all');
    setSortBy('name');
    setSortOrder('asc');
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (searchTerm) count++;
    if (packageType !== 'all') count++;
    if (priceRange !== 'all') count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className="space-y-4">
      {/* Search and Filter Toggle */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search packages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          Filters
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
          {/* Package Type Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Package Type</label>
            <Select value={packageType} onValueChange={setPackageType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="HALF_DAY">Half Day</SelectItem>
                <SelectItem value="FULL_DAY">Full Day</SelectItem>
                <SelectItem value="SEMESTER_BUNDLE">Semester Bundle</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Price Range Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Price Range</label>
            <Select value={priceRange} onValueChange={setPriceRange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Prices</SelectItem>
                <SelectItem value="0-50">Under SGD 50</SelectItem>
                <SelectItem value="50-100">SGD 50 - 100</SelectItem>
                <SelectItem value="100-200">SGD 100 - 200</SelectItem>
                <SelectItem value="200-500">SGD 200 - 500</SelectItem>
                <SelectItem value="500">Above SGD 500</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sort By */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Sort By</label>
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="price">Price</SelectItem>
                <SelectItem value="hours">Total Hours</SelectItem>
                <SelectItem value="validity">Validity Days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sort Order */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Order</label>
            <div className="flex gap-2">
              <Button
                variant={sortOrder === 'asc' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortOrder('asc')}
                className="flex-1"
              >
                <SortAsc className="h-4 w-4 mr-1" />
                Asc
              </Button>
              <Button
                variant={sortOrder === 'desc' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortOrder('desc')}
                className="flex-1"
              >
                <SortDesc className="h-4 w-4 mr-1" />
                Desc
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {searchTerm && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Search: "{searchTerm}"
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => setSearchTerm('')}
              />
            </Badge>
          )}
          {packageType !== 'all' && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Type: {packageType.replace('_', ' ')}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => setPackageType('all')}
              />
            </Badge>
          )}
          {priceRange !== 'all' && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Price: {priceRange === '500' ? 'Above SGD 500' : `SGD ${priceRange}`}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => setPriceRange('all')}
              />
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-muted-foreground hover:text-foreground"
          >
            Clear all
          </Button>
        </div>
      )}

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredAndSortedPackages.length} of {packages.length} packages
      </div>
    </div>
  );
};

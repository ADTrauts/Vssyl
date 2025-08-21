"use client";

import React, { useState, useEffect } from 'react';
import { getCountries, getRegionsByCountry, getTownsByRegion, Country, Region, Town } from '../api/location';

interface LocationSelectorProps {
  selectedCountryId?: string;
  selectedRegionId?: string;
  selectedTownId?: string;
  onLocationChange: (countryId: string, regionId: string, townId: string) => void;
  disabled?: boolean;
}

export default function LocationSelector({
  selectedCountryId,
  selectedRegionId,
  selectedTownId,
  onLocationChange,
  disabled = false
}: LocationSelectorProps) {
  const [countries, setCountries] = useState<Country[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [towns, setTowns] = useState<Town[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load countries on component mount
  useEffect(() => {
    loadCountries();
  }, []);

  // Load regions when country changes
  useEffect(() => {
    if (selectedCountryId) {
      loadRegions(selectedCountryId);
    } else {
      setRegions([]);
      setTowns([]);
    }
  }, [selectedCountryId]);

  // Load towns when region changes
  useEffect(() => {
    if (selectedRegionId) {
      loadTowns(selectedRegionId);
    } else {
      setTowns([]);
    }
  }, [selectedRegionId]);

  const loadCountries = async () => {
    try {
      setLoading(true);
      setError(null);
      const countriesData = await getCountries();
      setCountries(countriesData);
    } catch (err) {
      setError('Failed to load countries');
      console.error('Error loading countries:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadRegions = async (countryId: string) => {
    try {
      setLoading(true);
      setError(null);
      const regionsData = await getRegionsByCountry(countryId);
      setRegions(regionsData);
    } catch (err) {
      setError('Failed to load regions');
      console.error('Error loading regions:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTowns = async (regionId: string) => {
    try {
      setLoading(true);
      setError(null);
      const townsData = await getTownsByRegion(regionId);
      setTowns(townsData);
    } catch (err) {
      setError('Failed to load towns');
      console.error('Error loading towns:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCountryChange = (countryId: string) => {
    onLocationChange(countryId, '', '');
  };

  const handleRegionChange = (regionId: string) => {
    onLocationChange(selectedCountryId || '', regionId, '');
  };

  const handleTownChange = (townId: string) => {
    onLocationChange(selectedCountryId || '', selectedRegionId || '', townId);
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="text-red-500 text-sm">{error}</div>
      )}
      
      {/* Country Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Country
        </label>
        <select
          value={selectedCountryId || ''}
          onChange={(e) => handleCountryChange(e.target.value)}
          disabled={disabled || loading}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
        >
          <option value="">Select a country</option>
          {countries.map((country) => (
            <option key={country.id} value={country.id}>
              {country.name}
            </option>
          ))}
        </select>
      </div>

      {/* Region Selector */}
      {selectedCountryId && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Region/State
          </label>
          <select
            value={selectedRegionId || ''}
            onChange={(e) => handleRegionChange(e.target.value)}
            disabled={disabled || loading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
          >
            <option value="">Select a region</option>
            {regions.map((region) => (
              <option key={region.id} value={region.id}>
                {region.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Town Selector */}
      {selectedRegionId && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            City/Town
          </label>
          <select
            value={selectedTownId || ''}
            onChange={(e) => handleTownChange(e.target.value)}
            disabled={disabled || loading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
          >
            <option value="">Select a city</option>
            {towns.map((town) => (
              <option key={town.id} value={town.id}>
                {town.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {loading && (
        <div className="text-sm text-gray-500">Loading...</div>
      )}
    </div>
  );
} 
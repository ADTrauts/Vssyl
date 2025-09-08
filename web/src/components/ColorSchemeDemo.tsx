'use client';

import React from 'react';
import { COLORS } from 'shared/styles/theme';

export default function ColorSchemeDemo() {
  const colorPairs = [
    { name: 'Accent Red', key: 'accentRed', hex: COLORS.accentRed, usage: 'Warnings, accent buttons, highlights' },
    { name: 'Primary Green', key: 'primaryGreen', hex: COLORS.primaryGreen, usage: 'Main brand, primary buttons, success states' },
    { name: 'Highlight Yellow', key: 'highlightYellow', hex: COLORS.highlightYellow, usage: 'Notifications, callouts, badges' },
    { name: 'Secondary Purple', key: 'secondaryPurple', hex: COLORS.secondaryPurple, usage: 'Secondary actions, module accents' },
    { name: 'Info Blue', key: 'infoBlue', hex: COLORS.infoBlue, usage: 'Information states, links, secondary buttons' },
    { name: 'Neutral Dark', key: 'neutralDark', hex: COLORS.neutralDark, usage: 'Text, headers' },
    { name: 'Neutral Mid', key: 'neutralMid', hex: COLORS.neutralMid, usage: 'Backgrounds, panels' },
    { name: 'Neutral Light', key: 'neutralLight', hex: COLORS.neutralLight, usage: 'Light backgrounds, surfaces' },
  ];

  return (
    <div className="p-8 bg-white dark:bg-slate-800 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
        Block on Block Brand Colors
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {colorPairs.map((color) => (
          <div key={color.key} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
            <div 
              className="w-full h-16 rounded-md mb-3 border border-gray-300 dark:border-gray-500"
              style={{ backgroundColor: color.hex }}
            />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{color.name}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">{color.hex}</p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">{color.usage}</p>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Component Examples</h3>
        
        <div className="flex flex-wrap gap-3">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
            Primary Button (Brand Blue!)
          </button>
          <button className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors">
            Accent Button (Now Red!)
          </button>
          <button className="bg-yellow-500 text-black px-4 py-2 rounded-md hover:bg-yellow-600 transition-colors">
            Warning Button (Now Yellow!)
          </button>
          <button className="border-2 border-blue-600 text-blue-600 px-4 py-2 rounded-md hover:bg-blue-50 transition-colors">
            Outline Button (Brand Blue!)
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 dark:bg-slate-700 p-4 rounded-lg">
            <h4 className="text-blue-600 font-semibold mb-2">Info Panel (Brand Blue)</h4>
            <p className="text-gray-700 dark:text-gray-300">This panel uses the brand's blue color for headers and buttons.</p>
          </div>
          
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-lg">
            <h4 className="text-red-600 font-semibold mb-2">Warning Panel (Brand Accent)</h4>
            <p className="text-gray-700 dark:text-gray-300">This panel uses the brand's accent red color for warnings.</p>
          </div>
        </div>

        <div className="bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 p-4 rounded-lg">
          <h4 className="text-yellow-700 dark:text-yellow-400 font-semibold mb-2">Notification Banner (Brand Highlight)</h4>
          <p className="text-gray-700 dark:text-gray-300">This uses the brand's highlight yellow for notifications and callouts.</p>
        </div>
      </div>

      <div className="mt-6 p-4 bg-gray-100 dark:bg-slate-700 rounded-lg">
        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">CSS Variables in Use:</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm font-mono">
          <div className="text-gray-700 dark:text-gray-300">--primary-green</div>
          <div className="text-gray-700 dark:text-gray-300">--accent-red</div>
          <div className="text-gray-700 dark:text-gray-300">--highlight-yellow</div>
          <div className="text-gray-700 dark:text-gray-300">--info-blue</div>
        </div>
      </div>
    </div>
  );
}

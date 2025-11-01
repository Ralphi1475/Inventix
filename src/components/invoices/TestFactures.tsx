'use client';
import React from 'react';

export function TestFactures() {
  console.log('🚨 TEST FACTURES CHARGÉ');
  
  return (
    <div className="p-8">
      <div className="bg-red-500 text-white text-4xl p-8 rounded-lg">
        🚨 SI VOUS VOYEZ CECI, LE FICHIER EST DÉPLOYÉ 🚨
      </div>
    </div>
  );
}
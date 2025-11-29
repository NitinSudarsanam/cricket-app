'use client';

import { useState, useEffect } from 'react';
import { DraftConfig, MandatoryRoles, EarlyRoundRule } from '@/types';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/useToast';

interface ValidationError {
  field?: string;
  message: string;
}

export function DraftConfigEditor() {
  const [config, setConfig] = useState<DraftConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/draft-config');
      if (!response.ok) throw new Error('Failed to fetch configuration');
      const result = await response.json();
      
      // API returns { success: true, data: config }
      if (result.success && result.data) {
        setConfig(result.data);
      } else {
        throw new Error('Invalid response format from API');
      }
      
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load configuration');
      setConfig(null);
    } finally {
      setLoading(false);
    }
  };

  const validateConfig = async () => {
    if (!config) return;
    
    try {
      setValidating(true);
      const response = await fetch('/api/draft-config/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      
      const result = await response.json();
      
      if (result.valid) {
        setValidationErrors([]);
        setSuccessMessage('Configuration is valid!');
        toast.success('Configuration is valid!');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        const errors = result.errors || [{ message: result.error }];
        setValidationErrors(errors);
        toast.error('Configuration validation failed. Please check the errors.');
      }
    } catch (err) {
      const errorMessage = 'Failed to validate configuration';
      setValidationErrors([{ message: errorMessage }]);
      toast.error(errorMessage, { onRetry: validateConfig });
    } finally {
      setValidating(false);
    }
  };

  const saveConfig = async () => {
    if (!config) return;
    
    try {
      setSaving(true);
      const response = await fetch('/api/draft-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save configuration');
      }
      
      const updatedConfig = await response.json();
      setConfig(updatedConfig);
      setValidationErrors([]);
      setSuccessMessage('Configuration saved successfully!');
      toast.success('Configuration saved successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save configuration';
      if (err instanceof Error && err.message.includes('validation')) {
        setValidationErrors([{ message: err.message }]);
        toast.error('Configuration validation failed. Please check the errors.');
      } else {
        setError(errorMessage);
        toast.error(errorMessage, { onRetry: saveConfig });
      }
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (updates: Partial<DraftConfig>) => {
    if (!config) return;
    
    const newConfig = { ...config, ...updates };
    
    // Auto-calculate totalRounds to match rosterSize
    if (updates.rosterSize !== undefined) {
      newConfig.totalRounds = updates.rosterSize;
    }
    
    // Calculate freeSlots
    const mandatoryTotal = Object.values(newConfig.mandatoryRoles).reduce((a, b) => a + b, 0);
    newConfig.freeSlots = newConfig.rosterSize - mandatoryTotal;
    
    setConfig(newConfig);
    setValidationErrors([]);
    setSuccessMessage(null);
  };

  const updateMandatoryRoles = (role: keyof MandatoryRoles, value: number) => {
    if (!config) return;
    
    const newMandatoryRoles = {
      ...config.mandatoryRoles,
      [role]: Math.max(0, value),
    };
    
    updateConfig({ mandatoryRoles: newMandatoryRoles });
  };

  const updateEarlyRoundRule = (field: keyof EarlyRoundRule, value: number) => {
    if (!config) return;
    
    const newEarlyRoundRule = {
      ...config.earlyRoundRule,
      [field]: Math.max(0, value),
    };
    
    updateConfig({ earlyRoundRule: newEarlyRoundRule });
  };

  if (loading) {
    return <LoadingSpinner variant="full-page" />;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        <p className="font-medium">Error loading configuration</p>
        <p className="text-sm mt-1">{error}</p>
        <button
          onClick={fetchConfig}
          className="mt-3 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!config || !config.mandatoryRoles) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700">
        <p className="font-medium">No configuration found</p>
        <p className="text-sm mt-1">Please create a draft configuration first.</p>
      </div>
    );
  }

  const mandatoryTotal = Object.values(config.mandatoryRoles).reduce((a, b) => a + b, 0);
  const freeSlots = config.freeSlots;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Draft Configuration</h2>
          <p className="text-sm text-gray-600 mt-1">
            Configure the rules and constraints for your draft
          </p>
        </div>
        <div className="flex gap-3 flex-shrink-0">
          <button
            onClick={validateConfig}
            disabled={validating}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {validating ? 'Validating...' : 'Validate'}
          </button>
          <button
            onClick={saveConfig}
            disabled={saving || config.isLocked}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          {successMessage}
        </div>
      )}

      {validationErrors.length > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h4 className="font-medium text-red-900 mb-2">Validation Errors:</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
            {validationErrors.map((err, i) => (
              <li key={i}>{err.message}</li>
            ))}
          </ul>
        </div>
      )}

      {config.isLocked && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
          ⚠️ Configuration is locked because a draft is in progress
        </div>
      )}

      {/* Roster Size */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Roster Settings</h3>
        
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">
              Roster Size: {config.rosterSize}
            </label>
            <span className="text-sm text-gray-500">
              Total Rounds: {config.totalRounds}
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="20"
            value={config.rosterSize}
            onChange={(e) => updateConfig({ rosterSize: parseInt(e.target.value) })}
            disabled={config.isLocked}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>1</span>
            <span>20</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Min Players Per Team
            </label>
            <input
              type="number"
              min="0"
              max={config.rosterSize}
              value={config.minPerTeam}
              onChange={(e) => updateConfig({ minPerTeam: parseInt(e.target.value) || 0 })}
              disabled={config.isLocked}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Players Per Team
            </label>
            <input
              type="number"
              min={config.minPerTeam}
              max={config.rosterSize}
              value={config.maxPerTeam}
              onChange={(e) => updateConfig({ maxPerTeam: parseInt(e.target.value) || 0 })}
              disabled={config.isLocked}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* Role Requirements */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Mandatory Role Requirements</h3>
          <div className="text-sm">
            <span className="text-gray-600">Total: </span>
            <span className={`font-semibold ${mandatoryTotal > config.rosterSize ? 'text-red-600' : 'text-gray-900'}`}>
              {mandatoryTotal} / {config.rosterSize}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Batsmen (Bat)
            </label>
            <input
              type="number"
              min="0"
              max={config.rosterSize}
              value={config.mandatoryRoles.Bat}
              onChange={(e) => updateMandatoryRoles('Bat', parseInt(e.target.value) || 0)}
              disabled={config.isLocked}
              className="w-full px-3 py-2.5 md:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed text-base"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bowlers (Bowl)
            </label>
            <input
              type="number"
              min="0"
              max={config.rosterSize}
              value={config.mandatoryRoles.Bowl}
              onChange={(e) => updateMandatoryRoles('Bowl', parseInt(e.target.value) || 0)}
              disabled={config.isLocked}
              className="w-full px-3 py-2.5 md:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed text-base"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              All-Rounders (AR)
            </label>
            <input
              type="number"
              min="0"
              max={config.rosterSize}
              value={config.mandatoryRoles.AR}
              onChange={(e) => updateMandatoryRoles('AR', parseInt(e.target.value) || 0)}
              disabled={config.isLocked}
              className="w-full px-3 py-2.5 md:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed text-base"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Wicket-Keepers (WK)
            </label>
            <input
              type="number"
              min="0"
              max={config.rosterSize}
              value={config.mandatoryRoles.WK}
              onChange={(e) => updateMandatoryRoles('WK', parseInt(e.target.value) || 0)}
              disabled={config.isLocked}
              className="w-full px-3 py-2.5 md:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed text-base"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Free Slots (Flexible picks):</span>
            <span className={`font-semibold ${freeSlots < 0 ? 'text-red-600' : 'text-green-600'}`}>
              {freeSlots}
            </span>
          </div>
          {freeSlots < 0 && (
            <p className="text-xs text-red-600 mt-1">
              ⚠️ Mandatory roles exceed roster size
            </p>
          )}
        </div>
      </div>

      {/* Early Round Rules */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Early-Round Rules</h3>
        <p className="text-sm text-gray-600">
          Enforce minimum role requirements within the first N rounds
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Apply to First N Rounds
            </label>
            <input
              type="number"
              min="0"
              max={config.totalRounds}
              value={config.earlyRoundRule.rounds}
              onChange={(e) => updateEarlyRoundRule('rounds', parseInt(e.target.value) || 0)}
              disabled={config.isLocked}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Min Batsmen
            </label>
            <input
              type="number"
              min="0"
              max={config.mandatoryRoles.Bat}
              value={config.earlyRoundRule.minBat}
              onChange={(e) => updateEarlyRoundRule('minBat', parseInt(e.target.value) || 0)}
              disabled={config.isLocked}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Min Bowlers
            </label>
            <input
              type="number"
              min="0"
              max={config.mandatoryRoles.Bowl}
              value={config.earlyRoundRule.minBowl}
              onChange={(e) => updateEarlyRoundRule('minBowl', parseInt(e.target.value) || 0)}
              disabled={config.isLocked}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        {config.earlyRoundRule.rounds > 0 && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
            ℹ️ Participants must draft at least {config.earlyRoundRule.minBat} Batsmen and{' '}
            {config.earlyRoundRule.minBowl} Bowlers within the first {config.earlyRoundRule.rounds} rounds
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuration Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Roster Size:</span>
            <span className="ml-2 font-medium text-gray-900">{config.rosterSize} players</span>
          </div>
          <div>
            <span className="text-gray-600">Total Rounds:</span>
            <span className="ml-2 font-medium text-gray-900">{config.totalRounds}</span>
          </div>
          <div>
            <span className="text-gray-600">Team Constraints:</span>
            <span className="ml-2 font-medium text-gray-900">
              {config.minPerTeam} - {config.maxPerTeam} per team
            </span>
          </div>
          <div>
            <span className="text-gray-600">Mandatory Roles:</span>
            <span className="ml-2 font-medium text-gray-900">
              {mandatoryTotal} required, {freeSlots} free
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

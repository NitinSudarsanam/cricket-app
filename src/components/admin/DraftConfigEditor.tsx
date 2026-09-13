'use client';

import { useState, useEffect } from 'react';
import { DraftConfig, MandatoryRoles, EarlyRoundRule } from '@/types';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/useToast';
import { Button, Alert, Card, StatDisplay } from '@/components/ui';

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
      <Alert variant="danger">
        <p className="font-medium">Error loading configuration</p>
        <p className="text-sm mt-1">{error}</p>
        <div className="mt-3">
          <Button variant="danger" size="sm" onClick={fetchConfig}>
            Retry
          </Button>
        </div>
      </Alert>
    );
  }

  if (!config || !config.mandatoryRoles) {
    return (
      <Alert variant="warning">
        <p className="font-medium">No configuration found</p>
        <p className="text-sm mt-1">Please create a draft configuration first.</p>
      </Alert>
    );
  }

  const mandatoryTotal = Object.values(config.mandatoryRoles).reduce((a, b) => a + b, 0);
  const freeSlots = config.freeSlots;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Draft Configuration</h2>
          <p className="text-sm text-slate-600 mt-1">
            Configure the rules and constraints for your draft
          </p>
        </div>
        <div className="flex gap-3 flex-shrink-0">
          <Button onClick={validateConfig} disabled={validating} variant="secondary">
            {validating ? 'Validating...' : 'Validate'}
          </Button>
          <Button onClick={saveConfig} disabled={saving || config.isLocked} variant="primary">
            {saving ? 'Saving...' : 'Save Configuration'}
          </Button>
        </div>
      </div>

      {successMessage && (
        <Alert variant="success">{successMessage}</Alert>
      )}

      {validationErrors.length > 0 && (
        <Alert variant="danger">
          <h4 className="font-medium mb-2">Validation Errors:</h4>
          <ul className="list-disc list-inside space-y-1 text-sm">
            {validationErrors.map((err, i) => (
              <li key={i}>{err.message}</li>
            ))}
          </ul>
        </Alert>
      )}

      {config.isLocked && (
        <Alert variant="warning">Configuration is locked because a draft is in progress</Alert>
      )}

      {/* Roster Size */}
      <Card padded className="space-y-4">
        <h3 className="heading-md">Roster Settings</h3>
        
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-slate-700">
              Roster Size: {config.rosterSize}
            </label>
            <span className="text-sm text-slate-500">
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
            className="w-full h-2 bg-slate-200 rounded-md appearance-none cursor-pointer accent-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>1</span>
            <span>20</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Min Players Per Team
            </label>
            <input
              type="number"
              min="0"
              max={config.rosterSize}
              value={config.minPerTeam}
              onChange={(e) => updateConfig({ minPerTeam: parseInt(e.target.value) || 0 })}
              disabled={config.isLocked}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Max Players Per Team
            </label>
            <input
              type="number"
              min={config.minPerTeam}
              max={config.rosterSize}
              value={config.maxPerTeam}
              onChange={(e) => updateConfig({ maxPerTeam: parseInt(e.target.value) || 0 })}
              disabled={config.isLocked}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Pick Timer (seconds)
            </label>
            <input
              type="number"
              min="10"
              max="600"
              value={config.pickTimeoutSeconds ?? 60}
              onChange={(e) => updateConfig({ pickTimeoutSeconds: parseInt(e.target.value) || 60 })}
              disabled={config.isLocked}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>
      </Card>

      {/* Role Requirements */}
      <Card padded className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="heading-md">Mandatory Role Requirements</h3>
          <StatDisplay
            label="Total"
            value={`${mandatoryTotal} / ${config.rosterSize}`}
            size="md"
            variant={mandatoryTotal > config.rosterSize ? 'highlight' : 'default'}
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Batsmen (Bat)
            </label>
            <input
              type="number"
              min="0"
              max={config.rosterSize}
              value={config.mandatoryRoles.Bat}
              onChange={(e) => updateMandatoryRoles('Bat', parseInt(e.target.value) || 0)}
              disabled={config.isLocked}
              className="w-full px-3 py-2.5 md:py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed text-base"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Bowlers (Bowl)
            </label>
            <input
              type="number"
              min="0"
              max={config.rosterSize}
              value={config.mandatoryRoles.Bowl}
              onChange={(e) => updateMandatoryRoles('Bowl', parseInt(e.target.value) || 0)}
              disabled={config.isLocked}
              className="w-full px-3 py-2.5 md:py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed text-base"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              All-Rounders (AR)
            </label>
            <input
              type="number"
              min="0"
              max={config.rosterSize}
              value={config.mandatoryRoles.AR}
              onChange={(e) => updateMandatoryRoles('AR', parseInt(e.target.value) || 0)}
              disabled={config.isLocked}
              className="w-full px-3 py-2.5 md:py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed text-base"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Wicket-Keepers (WK)
            </label>
            <input
              type="number"
              min="0"
              max={config.rosterSize}
              value={config.mandatoryRoles.WK}
              onChange={(e) => updateMandatoryRoles('WK', parseInt(e.target.value) || 0)}
              disabled={config.isLocked}
              className="w-full px-3 py-2.5 md:py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed text-base"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Free Slots (Flexible picks):</span>
            <span className={`font-semibold ${freeSlots < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
              {freeSlots}
            </span>
          </div>
          {freeSlots < 0 && (
            <p className="text-xs text-red-600 mt-1">
              Mandatory roles exceed roster size
            </p>
          )}
        </div>
      </Card>

      {/* Early Round Rules */}
      <Card padded className="space-y-4">
        <h3 className="heading-md">Early-Round Rules</h3>
        <p className="text-sm text-slate-600">
          Enforce minimum role requirements within the first N rounds
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Apply to First N Rounds
            </label>
            <input
              type="number"
              min="0"
              max={config.totalRounds}
              value={config.earlyRoundRule.rounds}
              onChange={(e) => updateEarlyRoundRule('rounds', parseInt(e.target.value) || 0)}
              disabled={config.isLocked}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Min Batsmen
            </label>
            <input
              type="number"
              min="0"
              max={config.mandatoryRoles.Bat}
              value={config.earlyRoundRule.minBat}
              onChange={(e) => updateEarlyRoundRule('minBat', parseInt(e.target.value) || 0)}
              disabled={config.isLocked}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Min Bowlers
            </label>
            <input
              type="number"
              min="0"
              max={config.mandatoryRoles.Bowl}
              value={config.earlyRoundRule.minBowl}
              onChange={(e) => updateEarlyRoundRule('minBowl', parseInt(e.target.value) || 0)}
              disabled={config.isLocked}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        {config.earlyRoundRule.rounds > 0 && (
          <Alert variant="info">
            Participants must draft at least {config.earlyRoundRule.minBat} Batsmen and{' '}
            {config.earlyRoundRule.minBowl} Bowlers within the first {config.earlyRoundRule.rounds} rounds.
          </Alert>
        )}
      </Card>

      {/* Summary */}
      <Card padded className="bg-slate-50">
        <h3 className="heading-md mb-4">Configuration Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-slate-600">Roster Size:</span>
            <span className="ml-2 font-medium text-slate-900">{config.rosterSize} players</span>
          </div>
          <div>
            <span className="text-slate-600">Total Rounds:</span>
            <span className="ml-2 font-medium text-slate-900">{config.totalRounds}</span>
          </div>
          <div>
            <span className="text-slate-600">Team Constraints:</span>
            <span className="ml-2 font-medium text-slate-900">
              {config.minPerTeam} - {config.maxPerTeam} per team
            </span>
          </div>
          <div>
            <span className="text-slate-600">Mandatory Roles:</span>
            <span className="ml-2 font-medium text-slate-900">
              {mandatoryTotal} required, {freeSlots} free
            </span>
          </div>
        </div>
        {freeSlots < 0 && (
          <p className="mt-4 text-sm text-red-600 font-medium" role="alert">
            Mandatory roles exceed roster size. Reduce required roles or increase roster size.
          </p>
        )}
      </Card>
    </div>
  );
}

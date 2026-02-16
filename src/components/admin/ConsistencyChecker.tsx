'use client';

import { useState, useEffect } from 'react';
import { DraftConfig } from '@/types';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Button, Card, Alert, StatDisplay, Badge } from '@/components/ui';

interface ValidationResult {
  valid: boolean;
  error?: string;
  errors?: string[];
}

export function ConsistencyChecker() {
  const [config, setConfig] = useState<DraftConfig | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAndValidate();
  }, []);

  const fetchAndValidate = async () => {
    try {
      setLoading(true);
      
      // Fetch current config
      const configResponse = await fetch('/api/draft-config');
      if (!configResponse.ok) throw new Error('Failed to fetch configuration');
      const configResult = await configResponse.json();
      
      // API returns { success: true, data: config }
      if (configResult.success && configResult.data) {
        setConfig(configResult.data);
        // Validate config
        await validateConfig(configResult.data);
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

  const validateConfig = async (configToValidate?: DraftConfig) => {
    const targetConfig = configToValidate || config;
    if (!targetConfig) return;
    
    try {
      setChecking(true);
      const response = await fetch('/api/draft-config/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(targetConfig),
      });
      
      const result = await response.json();
      setValidationResult(result);
    } catch (err) {
      setValidationResult({
        valid: false,
        error: 'Failed to validate configuration',
      });
    } finally {
      setChecking(false);
    }
  };

  const handleRecheck = () => {
    fetchAndValidate();
  };

  if (loading) {
    return <LoadingSpinner variant="inline" />;
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  if (!config || !validationResult) {
    return null;
  }

  // Config is invalid if API says so OR if mandatory roles exceed roster (negative free slots)
  const hasNegativeFreeSlots = config.freeSlots < 0;
  const isValid = validationResult.valid && !hasNegativeFreeSlots;
  const errorMessages = hasNegativeFreeSlots
    ? [
        `Mandatory roles exceed roster size. Free slots: ${config.freeSlots}. Reduce required roles or increase roster size.`,
        ...(validationResult.errors || (validationResult.error ? [validationResult.error] : [])),
      ]
    : (validationResult.errors || (validationResult.error ? [validationResult.error] : []));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Configuration Consistency Check</h2>
          <p className="text-sm text-slate-600 mt-1">
            Validates that your draft configuration is mathematically feasible
          </p>
        </div>
        <Button onClick={handleRecheck} disabled={checking} variant="secondary">
          {checking ? 'Checking...' : 'Recheck'}
        </Button>
      </div>

      {/* Validation Result Card */}
      <Card
        padded
        className={
          isValid ? 'bg-green-50 border-2 border-green-300' : 'bg-red-50 border-2 border-red-300'
        }
      >
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="flex-shrink-0">
            {isValid ? (
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1">
            <h3 className={`text-lg font-semibold mb-2 ${isValid ? 'text-green-900' : 'text-red-900'}`}>
              {isValid ? 'Configuration is Valid' : 'Configuration Has Errors'}
            </h3>
            
            {isValid ? (
              <p className="text-green-800">
                Your draft configuration passes all validation checks and is ready to use. 
                You can start a draft with this configuration.
              </p>
            ) : (
              <div className="space-y-3">
                <p className="text-red-800">
                  The following issues were found with your configuration:
                </p>
                <ul className="space-y-2">
                  {errorMessages.map((error, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-red-700">
                      <span className="text-red-500 mt-0.5">•</span>
                      <span>{error}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-sm text-red-700 mt-4">
                  Please fix these issues in the Draft Configuration editor before starting a draft.
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Configuration Details */}
      <Card padded>
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Current Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <StatDisplay label="Roster Size" value={config.rosterSize} size="md" />
            <div className="flex justify-between">
              <span className="text-gray-600">Total Rounds:</span>
              <span className="font-medium text-gray-900">{config.totalRounds}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Min Per Team:</span>
              <span className="font-medium text-gray-900">{config.minPerTeam}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Max Per Team:</span>
              <span className="font-medium text-gray-900">{config.maxPerTeam}</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Batsmen Required:</span>
              <span className="font-medium text-gray-900">{config.mandatoryRoles.Bat}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Bowlers Required:</span>
              <span className="font-medium text-gray-900">{config.mandatoryRoles.Bowl}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">All-Rounders Required:</span>
              <span className="font-medium text-gray-900">{config.mandatoryRoles.AR}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Wicket-Keepers Required:</span>
              <span className="font-medium text-gray-900">{config.mandatoryRoles.WK}</span>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-200">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Free Slots:</span>
            <span
              className={`font-semibold ${
                config.freeSlots < 0 ? 'text-red-600' : 'text-emerald-600'
              }`}
            >
              {config.freeSlots}
            </span>
          </div>
        </div>

        {config.earlyRoundRule.rounds > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <h4 className="text-sm font-medium text-slate-900 mb-2">Early-Round Rules</h4>
            <div className="text-sm text-slate-700">
              Within first {config.earlyRoundRule.rounds} rounds:{' '}
              {config.earlyRoundRule.minBat} Batsmen, {config.earlyRoundRule.minBowl} Bowlers
            </div>
          </div>
        )}
      </Card>

      {/* Validation Checks Breakdown */}
      <Card padded>
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Validation Checks</h3>
        <div className="space-y-3">
          <ValidationCheck
            label="Roster Feasibility"
            description="Mandatory roles do not exceed roster size"
            passed={config.freeSlots >= 0}
          />
          <ValidationCheck
            label="Team Constraints"
            description="Roster size is achievable with team limits"
            passed={config.rosterSize <= 10 * config.maxPerTeam}
          />
          <ValidationCheck
            label="Early-Round Rules"
            description="Early-round requirements are feasible"
            passed={
              config.earlyRoundRule.minBat + config.earlyRoundRule.minBowl <= config.earlyRoundRule.rounds &&
              config.earlyRoundRule.minBat <= config.mandatoryRoles.Bat &&
              config.earlyRoundRule.minBowl <= config.mandatoryRoles.Bowl
            }
          />
          <ValidationCheck
            label="Overall Validity"
            description="All validation checks pass"
            passed={isValid}
          />
        </div>
      </Card>
    </div>
  );
}

// Validation Check Item Component
function ValidationCheck({ 
  label, 
  description, 
  passed 
}: { 
  label: string; 
  description: string; 
  passed: boolean;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
      <div className="flex-shrink-0 mt-0.5">
        {passed ? (
          <svg
            className="w-5 h-5 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        ) : (
          <svg
            className="w-5 h-5 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        )}
      </div>
      <div className="flex-1">
        <div className="font-medium text-gray-900 text-sm">{label}</div>
        <div className="text-xs text-gray-600 mt-0.5">{description}</div>
      </div>
    </div>
  );
}

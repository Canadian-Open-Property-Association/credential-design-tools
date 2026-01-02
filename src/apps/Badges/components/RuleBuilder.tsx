import { useEffect } from 'react';
import { useBadgeStore } from '../../../store/badgeStore';
import { useDictionaryStore } from '../../../store/dictionaryStore';
import type { EligibilityRule, RuleOperator } from '../../../types/badge';
import { OPERATOR_LABELS, generateRuleDescription } from '../../../types/badge';

export default function RuleBuilder() {
  const {
    currentBadge,
    updateCurrentBadge,
    addEligibilityRule,
    updateEligibilityRule,
    removeEligibilityRule,
  } = useBadgeStore();

  const { vocabTypes, fetchVocabTypes } = useDictionaryStore();

  // Load vocab types on mount
  useEffect(() => {
    fetchVocabTypes();
  }, [fetchVocabTypes]);

  if (!currentBadge) return null;

  const rules = currentBadge.eligibilityRules;

  // Get properties for a vocab type
  const getPropertiesForVocabType = (vocabTypeId: string) => {
    const vocabType = vocabTypes.find((vt) => vt.id === vocabTypeId);
    return vocabType?.properties || [];
  };

  // Get vocab type name
  const getVocabTypeName = (vocabTypeId: string) => {
    const vocabType = vocabTypes.find((vt) => vt.id === vocabTypeId);
    return vocabType?.name || vocabTypeId;
  };

  // Get property name
  const getPropertyName = (vocabTypeId: string, propertyId: string) => {
    const properties = getPropertiesForVocabType(vocabTypeId);
    const property = properties.find((p) => p.id === propertyId);
    return property?.name || propertyId;
  };

  // Handle rule update
  const handleUpdateRule = (index: number, updates: Partial<EligibilityRule>) => {
    const rule = rules[index];
    const newRule = { ...rule, ...updates };

    // Auto-generate description
    if (!newRule.description || newRule.description === rule.description) {
      newRule.description = generateRuleDescription(
        newRule,
        getVocabTypeName(newRule.vocabTypeId),
        getPropertyName(newRule.vocabTypeId, newRule.vocabPropertyId)
      );
    }

    updateEligibilityRule(index, newRule);
  };

  // Handle vocab type change - reset property when type changes
  const handleVocabTypeChange = (index: number, vocabTypeId: string) => {
    handleUpdateRule(index, {
      vocabTypeId,
      vocabPropertyId: '',
      value: undefined,
    });
  };

  const operators: RuleOperator[] = [
    'equals',
    'not_equals',
    'greater_than',
    'less_than',
    'greater_or_equal',
    'less_or_equal',
    'contains',
    'exists',
    'count_gte',
  ];

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-700">Eligibility Rules</h3>
          <p className="text-xs text-gray-500 mt-1">
            Define the conditions that must be met to earn this badge
          </p>
        </div>
        <button
          onClick={addEligibilityRule}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add Rule
        </button>
      </div>

      {/* Rule Logic */}
      {rules.length > 1 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Rule Logic</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="ruleLogic"
                value="all"
                checked={currentBadge.ruleLogic === 'all'}
                onChange={() => updateCurrentBadge('ruleLogic', 'all')}
                className="text-amber-600 focus:ring-amber-500"
              />
              <span className="text-sm text-gray-700">ALL rules must pass</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="ruleLogic"
                value="any"
                checked={currentBadge.ruleLogic === 'any'}
                onChange={() => updateCurrentBadge('ruleLogic', 'any')}
                className="text-amber-600 focus:ring-amber-500"
              />
              <span className="text-sm text-gray-700">ANY rule must pass</span>
            </label>
          </div>
        </div>
      )}

      {/* Rules list */}
      {rules.length === 0 ? (
        <div className="bg-gray-50 rounded-lg border border-gray-200 px-6 py-10 text-center">
          <svg
            className="w-12 h-12 mx-auto mb-4 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-sm text-gray-600 mb-2">No eligibility rules defined</p>
          <p className="text-xs text-gray-400 mb-4">
            Add rules to define when this badge can be earned
          </p>
          <button
            onClick={addEligibilityRule}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-amber-600 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add First Rule
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {rules.map((rule, index) => {
            const properties = getPropertiesForVocabType(rule.vocabTypeId);
            const showValueInput = rule.operator !== 'exists';

            return (
              <div
                key={rule.id}
                className="bg-white rounded-lg border border-gray-200 p-4 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Rule {index + 1}</span>
                  <button
                    onClick={() => removeEligibilityRule(index)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    title="Remove rule"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Vocab Type */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Vocabulary Type
                    </label>
                    <select
                      value={rule.vocabTypeId}
                      onChange={(e) => handleVocabTypeChange(index, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    >
                      <option value="">Select vocab type...</option>
                      {vocabTypes.map((vt) => (
                        <option key={vt.id} value={vt.id}>
                          {vt.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Property */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Property</label>
                    <select
                      value={rule.vocabPropertyId}
                      onChange={(e) => handleUpdateRule(index, { vocabPropertyId: e.target.value })}
                      disabled={!rule.vocabTypeId}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="">Select property...</option>
                      {properties.map((prop) => (
                        <option key={prop.id} value={prop.id}>
                          {prop.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Operator */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Operator</label>
                    <select
                      value={rule.operator}
                      onChange={(e) =>
                        handleUpdateRule(index, { operator: e.target.value as RuleOperator })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    >
                      {operators.map((op) => (
                        <option key={op} value={op}>
                          {OPERATOR_LABELS[op]}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Value */}
                  {showValueInput && (
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Value</label>
                      <input
                        type="text"
                        value={rule.value ?? ''}
                        onChange={(e) => {
                          // Try to parse as number if it looks like one
                          const value = e.target.value;
                          const numValue = parseFloat(value);
                          handleUpdateRule(index, {
                            value: !isNaN(numValue) && value.trim() !== '' ? numValue : value,
                          });
                        }}
                        placeholder="Enter value..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      />
                    </div>
                  )}
                </div>

                {/* Generated description */}
                <div className="pt-2 border-t border-gray-100">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Description (auto-generated)
                  </label>
                  <input
                    type="text"
                    value={rule.description || ''}
                    onChange={(e) => updateEligibilityRule(index, { description: e.target.value })}
                    placeholder="Human-readable rule description..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

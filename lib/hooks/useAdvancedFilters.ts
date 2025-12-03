/**
 * useAdvancedFilters - Hook pour la gestion et l'évaluation des filtres avancés
 * Best Practices: React Query Builder pattern + DevExpress evaluation logic
 * @see https://react-querybuilder.js.org/
 */

import { useState, useCallback, useMemo } from "react";
import type {
  FilterGroup,
  FilterCondition,
  FilterOperator,
  LogicOperator,
} from "@/lib/config/filter-config";
import {
  createEmptyGroup,
  createEmptyCondition,
  getFieldType,
  getOperatorsForField,
} from "@/lib/config/filter-config";
import type { Lead } from "@/types/crm";

// Storage key pour persistance localStorage
const STORAGE_KEY = "crm_leads_advanced_filters";

interface UseAdvancedFiltersReturn {
  // State
  filterGroup: FilterGroup;
  isActive: boolean;
  conditionsCount: number;

  // Actions sur le groupe principal
  setLogic: (logic: LogicOperator) => void;
  reset: () => void;

  // Actions sur les conditions
  addCondition: (groupId?: string) => void;
  updateCondition: (
    conditionId: string,
    updates: Partial<FilterCondition>
  ) => void;
  removeCondition: (conditionId: string) => void;

  // Actions sur les groupes nested
  addGroup: (parentGroupId?: string) => void;
  updateGroupLogic: (groupId: string, logic: LogicOperator) => void;
  removeGroup: (groupId: string) => void;

  // Évaluation
  evaluateLeads: (leads: Lead[]) => Lead[];

  // Persistance
  saveToStorage: () => void;
  loadFromStorage: () => void;

  // Import (E2-B Saved Views)
  importFilterGroup: (group: FilterGroup | null) => void;
}

/**
 * Évalue une condition sur un lead
 */
function evaluateCondition(lead: Lead, condition: FilterCondition): boolean {
  const { field, operator, value, valueTo } = condition;

  // Accès dynamique au champ du lead
  const fieldValue = getNestedValue(lead as object, field);

  // Opérateurs sans valeur
  if (operator === "is_empty") {
    return fieldValue === null || fieldValue === undefined || fieldValue === "";
  }
  if (operator === "is_not_empty") {
    return fieldValue !== null && fieldValue !== undefined && fieldValue !== "";
  }

  // Si pas de valeur à comparer, condition invalide = true (skip)
  if (value === undefined || value === null || value === "") {
    return true;
  }

  const fieldType = getFieldType(field);

  // Évaluation par type
  switch (fieldType) {
    case "text":
      return evaluateTextCondition(
        String(fieldValue ?? ""),
        operator,
        String(value)
      );

    case "number":
      return evaluateNumberCondition(
        fieldValue as number | null,
        operator,
        Number(value),
        valueTo !== undefined ? Number(valueTo) : undefined
      );

    case "date":
      return evaluateDateCondition(
        fieldValue as string | null,
        operator,
        String(value),
        valueTo as string | undefined
      );

    case "select":
      return evaluateSelectCondition(
        String(fieldValue ?? ""),
        operator,
        String(value)
      );

    case "multi_select":
      return evaluateMultiSelectCondition(
        String(fieldValue ?? ""),
        operator,
        Array.isArray(value) ? value : [value]
      );

    default:
      return true;
  }
}

/**
 * Accède à une valeur nested (ex: "assigned_to.first_name")
 */
function getNestedValue(obj: object, path: string): unknown {
  return path.split(".").reduce((acc: unknown, part: string) => {
    if (
      acc &&
      typeof acc === "object" &&
      part in (acc as Record<string, unknown>)
    ) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj as unknown);
}

/**
 * Évalue une condition texte
 */
function evaluateTextCondition(
  fieldValue: string,
  operator: FilterOperator,
  value: string
): boolean {
  const normalizedField = fieldValue.toLowerCase();
  const normalizedValue = value.toLowerCase();

  switch (operator) {
    case "equals":
      return normalizedField === normalizedValue;
    case "not_equals":
      return normalizedField !== normalizedValue;
    case "contains":
      return normalizedField.includes(normalizedValue);
    case "not_contains":
      return !normalizedField.includes(normalizedValue);
    case "starts_with":
      return normalizedField.startsWith(normalizedValue);
    case "ends_with":
      return normalizedField.endsWith(normalizedValue);
    default:
      return true;
  }
}

/**
 * Évalue une condition numérique
 */
function evaluateNumberCondition(
  fieldValue: number | null,
  operator: FilterOperator,
  value: number,
  valueTo?: number
): boolean {
  if (fieldValue === null || fieldValue === undefined) {
    return false;
  }

  switch (operator) {
    case "equals":
      return fieldValue === value;
    case "not_equals":
      return fieldValue !== value;
    case "greater_than":
      return fieldValue > value;
    case "less_than":
      return fieldValue < value;
    case "greater_than_or_equals":
      return fieldValue >= value;
    case "less_than_or_equals":
      return fieldValue <= value;
    case "between":
      return (
        valueTo !== undefined && fieldValue >= value && fieldValue <= valueTo
      );
    default:
      return true;
  }
}

/**
 * Évalue une condition date
 */
function evaluateDateCondition(
  fieldValue: string | null,
  operator: FilterOperator,
  value: string,
  valueTo?: string
): boolean {
  if (!fieldValue) return false;

  const fieldDate = new Date(fieldValue).getTime();
  const compareDate = new Date(value).getTime();
  const compareToDate = valueTo ? new Date(valueTo).getTime() : undefined;

  switch (operator) {
    case "equals":
      // Compare dates sans l'heure
      return (
        new Date(fieldValue).toDateString() === new Date(value).toDateString()
      );
    case "not_equals":
      return (
        new Date(fieldValue).toDateString() !== new Date(value).toDateString()
      );
    case "greater_than":
      return fieldDate > compareDate;
    case "less_than":
      return fieldDate < compareDate;
    case "between":
      return (
        compareToDate !== undefined &&
        fieldDate >= compareDate &&
        fieldDate <= compareToDate
      );
    default:
      return true;
  }
}

/**
 * Évalue une condition select (single value)
 */
function evaluateSelectCondition(
  fieldValue: string,
  operator: FilterOperator,
  value: string
): boolean {
  switch (operator) {
    case "equals":
      return fieldValue === value;
    case "not_equals":
      return fieldValue !== value;
    default:
      return true;
  }
}

/**
 * Évalue une condition multi-select (array of values)
 */
function evaluateMultiSelectCondition(
  fieldValue: string,
  operator: FilterOperator,
  values: string[]
): boolean {
  switch (operator) {
    case "in":
      return values.includes(fieldValue);
    case "not_in":
      return !values.includes(fieldValue);
    default:
      return true;
  }
}

/**
 * Évalue un groupe de filtres (récursif avec support nested groups)
 */
function evaluateGroup(lead: Lead, group: FilterGroup): boolean {
  const { logic, conditions, groups } = group;

  // Évaluer toutes les conditions du groupe
  const conditionResults = conditions.map((condition) =>
    evaluateCondition(lead, condition)
  );

  // Évaluer les groupes nested (récursif)
  const groupResults = groups.map((nestedGroup) =>
    evaluateGroup(lead, nestedGroup)
  );

  // Combiner tous les résultats
  const allResults = [...conditionResults, ...groupResults];

  if (allResults.length === 0) return true;

  // Appliquer la logique AND/OR
  if (logic === "AND") {
    return allResults.every((result) => result);
  } else {
    return allResults.some((result) => result);
  }
}

/**
 * Compte le nombre total de conditions dans un groupe (récursif)
 */
function countConditions(group: FilterGroup): number {
  let count = group.conditions.length;
  for (const nestedGroup of group.groups) {
    count += countConditions(nestedGroup);
  }
  return count;
}

/**
 * Hook principal pour les filtres avancés
 */
export function useAdvancedFilters(): UseAdvancedFiltersReturn {
  const [filterGroup, setFilterGroup] = useState<FilterGroup>(() =>
    createEmptyGroup("AND")
  );

  // Calcul du nombre de conditions
  const conditionsCount = useMemo(
    () => countConditions(filterGroup),
    [filterGroup]
  );

  // Vérifie si des filtres sont actifs (au moins une condition avec valeur)
  const isActive = useMemo(() => {
    const hasActiveCondition = (group: FilterGroup): boolean => {
      const hasConditionValue = group.conditions.some(
        (c) =>
          (c.value !== undefined && c.value !== null && c.value !== "") ||
          c.operator === "is_empty" ||
          c.operator === "is_not_empty"
      );
      if (hasConditionValue) return true;
      return group.groups.some((g) => hasActiveCondition(g));
    };
    return hasActiveCondition(filterGroup);
  }, [filterGroup]);

  // Actions sur le groupe principal
  const setLogic = useCallback((logic: LogicOperator) => {
    setFilterGroup((prev) => ({ ...prev, logic }));
  }, []);

  const reset = useCallback(() => {
    setFilterGroup(createEmptyGroup("AND"));
  }, []);

  // Actions sur les conditions
  const addCondition = useCallback((groupId?: string) => {
    const newCondition = createEmptyCondition();

    setFilterGroup((prev) => {
      if (!groupId || groupId === prev.id) {
        return { ...prev, conditions: [...prev.conditions, newCondition] };
      }

      // Chercher le groupe nested
      const updateNestedGroup = (group: FilterGroup): FilterGroup => {
        if (group.id === groupId) {
          return { ...group, conditions: [...group.conditions, newCondition] };
        }
        return {
          ...group,
          groups: group.groups.map(updateNestedGroup),
        };
      };

      return updateNestedGroup(prev);
    });
  }, []);

  const updateCondition = useCallback(
    (conditionId: string, updates: Partial<FilterCondition>) => {
      setFilterGroup((prev) => {
        const updateInGroup = (group: FilterGroup): FilterGroup => {
          const updatedConditions = group.conditions.map((c) => {
            if (c.id === conditionId) {
              const updated = { ...c, ...updates };
              // Si le champ change, reset l'opérateur au premier disponible
              if (updates.field && updates.field !== c.field) {
                const operators = getOperatorsForField(updates.field);
                updated.operator = operators[0];
                updated.value = "";
                updated.valueTo = undefined;
              }
              return updated;
            }
            return c;
          });

          return {
            ...group,
            conditions: updatedConditions,
            groups: group.groups.map(updateInGroup),
          };
        };

        return updateInGroup(prev);
      });
    },
    []
  );

  const removeCondition = useCallback((conditionId: string) => {
    setFilterGroup((prev) => {
      const removeFromGroup = (group: FilterGroup): FilterGroup => {
        return {
          ...group,
          conditions: group.conditions.filter((c) => c.id !== conditionId),
          groups: group.groups.map(removeFromGroup),
        };
      };

      return removeFromGroup(prev);
    });
  }, []);

  // Actions sur les groupes nested
  const addGroup = useCallback((parentGroupId?: string) => {
    const newGroup = createEmptyGroup("OR");

    setFilterGroup((prev) => {
      if (!parentGroupId || parentGroupId === prev.id) {
        return { ...prev, groups: [...prev.groups, newGroup] };
      }

      const addToNested = (group: FilterGroup): FilterGroup => {
        if (group.id === parentGroupId) {
          return { ...group, groups: [...group.groups, newGroup] };
        }
        return {
          ...group,
          groups: group.groups.map(addToNested),
        };
      };

      return addToNested(prev);
    });
  }, []);

  const updateGroupLogic = useCallback(
    (groupId: string, logic: LogicOperator) => {
      setFilterGroup((prev) => {
        if (prev.id === groupId) {
          return { ...prev, logic };
        }

        const updateNested = (group: FilterGroup): FilterGroup => {
          if (group.id === groupId) {
            return { ...group, logic };
          }
          return {
            ...group,
            groups: group.groups.map(updateNested),
          };
        };

        return updateNested(prev);
      });
    },
    []
  );

  const removeGroup = useCallback((groupId: string) => {
    setFilterGroup((prev) => {
      const removeNested = (group: FilterGroup): FilterGroup => {
        return {
          ...group,
          groups: group.groups
            .filter((g) => g.id !== groupId)
            .map(removeNested),
        };
      };

      return removeNested(prev);
    });
  }, []);

  // Évaluation des leads
  const evaluateLeads = useCallback(
    (leads: Lead[]): Lead[] => {
      if (!isActive) return leads;
      return leads.filter((lead) => evaluateGroup(lead, filterGroup));
    },
    [filterGroup, isActive]
  );

  // Persistance localStorage
  const saveToStorage = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filterGroup));
    } catch {
      // Silently fail
    }
  }, [filterGroup]);

  const loadFromStorage = useCallback(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as FilterGroup;
        setFilterGroup(parsed);
      }
    } catch {
      // Silently fail, keep default
    }
  }, []);

  // Import filter group from saved view (E2-B)
  const importFilterGroup = useCallback((group: FilterGroup | null) => {
    if (group) {
      setFilterGroup(group);
    } else {
      setFilterGroup(createEmptyGroup("AND"));
    }
  }, []);

  return {
    filterGroup,
    isActive,
    conditionsCount,
    setLogic,
    reset,
    addCondition,
    updateCondition,
    removeCondition,
    addGroup,
    updateGroupLogic,
    removeGroup,
    evaluateLeads,
    saveToStorage,
    loadFromStorage,
    importFilterGroup,
  };
}

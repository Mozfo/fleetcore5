/**
 * FilterRow - Une ligne de condition dans le filter builder
 * Best Practice: React Query Builder UI pattern
 * @see https://react-querybuilder.js.org/
 */

"use client";

import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select-native";
import {
  LEADS_FILTERABLE_FIELDS,
  OPERATOR_LABELS,
  STATIC_OPTIONS,
  getOperatorsForField,
  getFieldType,
  operatorRequiresValue,
  operatorRequiresTwoValues,
  type FilterCondition,
  type FilterOperator,
} from "@/lib/config/filter-config";

interface FilterRowProps {
  condition: FilterCondition;
  onUpdate: (updates: Partial<FilterCondition>) => void;
  onRemove: () => void;
  countries?: Array<{
    country_code: string;
    country_name_en: string;
    flag_emoji: string;
  }>;
  canRemove?: boolean;
}

export function FilterRow({
  condition,
  onUpdate,
  onRemove,
  countries = [],
  canRemove = true,
}: FilterRowProps) {
  const { t } = useTranslation("crm");
  const { field, operator, value, valueTo } = condition;

  const fieldType = getFieldType(field);
  const availableOperators = getOperatorsForField(field);
  const needsValue = operatorRequiresValue(operator);
  const needsTwoValues = operatorRequiresTwoValues(operator);

  // Get options for select fields
  const getSelectOptions = () => {
    const fieldConfig = LEADS_FILTERABLE_FIELDS.find((f) => f.key === field);
    if (!fieldConfig?.options) return [];

    if (fieldConfig.options === "countries") {
      return countries.map((c) => ({
        value: c.country_code,
        label: `${c.flag_emoji} ${c.country_name_en}`,
      }));
    }

    const staticOpts =
      STATIC_OPTIONS[fieldConfig.options as keyof typeof STATIC_OPTIONS];
    if (staticOpts) {
      return staticOpts.map((opt) => ({
        value: opt.value,
        label: opt.labelKey.startsWith("leads.")
          ? t(opt.labelKey)
          : opt.labelKey,
      }));
    }

    return [];
  };

  // Render value input based on field type
  const renderValueInput = () => {
    if (!needsValue) return null;

    if (fieldType === "select" || fieldType === "multi_select") {
      const options = getSelectOptions();
      return (
        <Select
          value={String(value ?? "")}
          onChange={(e) => onUpdate({ value: e.target.value })}
          className="min-w-[140px] flex-1"
        >
          <option value="">{t("leads.filters.select_value")}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
      );
    }

    if (fieldType === "number") {
      return (
        <div className="flex flex-1 items-center gap-2">
          <Input
            type="number"
            value={value !== undefined && value !== null ? String(value) : ""}
            onChange={(e) =>
              onUpdate({
                value: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            placeholder={t("leads.filters.enter_value")}
            className="min-w-[100px] flex-1"
          />
          {needsTwoValues && (
            <>
              <span className="text-muted-foreground text-sm">
                {t("leads.filters.and")}
              </span>
              <Input
                type="number"
                value={
                  valueTo !== undefined && valueTo !== null
                    ? String(valueTo)
                    : ""
                }
                onChange={(e) =>
                  onUpdate({
                    valueTo: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  })
                }
                placeholder={t("leads.filters.enter_value")}
                className="min-w-[100px] flex-1"
              />
            </>
          )}
        </div>
      );
    }

    if (fieldType === "date") {
      return (
        <div className="flex flex-1 items-center gap-2">
          <Input
            type="date"
            value={String(value ?? "")}
            onChange={(e) => onUpdate({ value: e.target.value })}
            className="min-w-[140px] flex-1"
          />
          {needsTwoValues && (
            <>
              <span className="text-muted-foreground text-sm">
                {t("leads.filters.and")}
              </span>
              <Input
                type="date"
                value={String(valueTo ?? "")}
                onChange={(e) => onUpdate({ valueTo: e.target.value })}
                className="min-w-[140px] flex-1"
              />
            </>
          )}
        </div>
      );
    }

    // V6.2.1: Boolean field type
    if (fieldType === "boolean") {
      return (
        <Select
          value={value === true ? "true" : value === false ? "false" : ""}
          onChange={(e) =>
            onUpdate({
              value:
                e.target.value === "true"
                  ? true
                  : e.target.value === "false"
                    ? false
                    : undefined,
            })
          }
          className="min-w-[100px] flex-1"
        >
          <option value="">{t("leads.filters.select_value")}</option>
          <option value="true">{t("leads.filters.boolean.yes")}</option>
          <option value="false">{t("leads.filters.boolean.no")}</option>
        </Select>
      );
    }

    // Default: text input
    return (
      <Input
        type="text"
        value={String(value ?? "")}
        onChange={(e) => onUpdate({ value: e.target.value })}
        placeholder={t("leads.filters.enter_value")}
        className="min-w-[140px] flex-1"
      />
    );
  };

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-gray-200 bg-gray-50/50 p-2 dark:border-gray-700 dark:bg-gray-800/50">
      {/* Field selector */}
      <Select
        value={field}
        onChange={(e) => onUpdate({ field: e.target.value })}
        className="min-w-[140px]"
      >
        {LEADS_FILTERABLE_FIELDS.map((f) => (
          <option key={f.key} value={f.key}>
            {t(f.labelKey)}
          </option>
        ))}
      </Select>

      {/* Operator selector */}
      <Select
        value={operator}
        onChange={(e) =>
          onUpdate({ operator: e.target.value as FilterOperator })
        }
        className="min-w-[140px]"
      >
        {availableOperators.map((op) => (
          <option key={op} value={op}>
            {t(OPERATOR_LABELS[op])}
          </option>
        ))}
      </Select>

      {/* Value input(s) */}
      {renderValueInput()}

      {/* Remove button */}
      {canRemove && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          className="h-8 w-8 shrink-0 text-gray-400 hover:text-red-500"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

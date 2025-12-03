/**
 * AdvancedFilters - Popover de filtres avancés avec conditions AND/OR
 * Best Practices:
 * - Eleken: Collapsible filters, chips, clear all button
 * - React Query Builder: Hierarchical tree structure, nested groups
 * @see https://www.eleken.co/blog-posts/filter-ux-and-ui-for-saas
 * @see https://react-querybuilder.js.org/
 */

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Filter,
  Plus,
  RotateCcw,
  ChevronDown,
  FolderPlus,
  Trash2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FilterRow } from "./FilterRow";
import type { FilterGroup, LogicOperator } from "@/lib/config/filter-config";

interface AdvancedFiltersProps {
  filterGroup: FilterGroup;
  isActive: boolean;
  conditionsCount: number;
  onSetLogic: (logic: LogicOperator) => void;
  onReset: () => void;
  onAddCondition: (groupId?: string) => void;
  onUpdateCondition: (
    conditionId: string,
    updates: Partial<
      Omit<import("@/lib/config/filter-config").FilterCondition, "id">
    >
  ) => void;
  onRemoveCondition: (conditionId: string) => void;
  onAddGroup: (parentGroupId?: string) => void;
  onUpdateGroupLogic: (groupId: string, logic: LogicOperator) => void;
  onRemoveGroup: (groupId: string) => void;
  countries?: Array<{
    country_code: string;
    country_name_en: string;
    flag_emoji: string;
  }>;
}

// Composant récursif pour afficher un groupe de filtres
function FilterGroupUI({
  group,
  onUpdateCondition,
  onRemoveCondition,
  onAddCondition,
  onAddGroup,
  onUpdateGroupLogic,
  onRemoveGroup,
  countries,
  isRoot = false,
  t,
}: {
  group: FilterGroup;
  onUpdateCondition: AdvancedFiltersProps["onUpdateCondition"];
  onRemoveCondition: AdvancedFiltersProps["onRemoveCondition"];
  onAddCondition: AdvancedFiltersProps["onAddCondition"];
  onAddGroup: AdvancedFiltersProps["onAddGroup"];
  onUpdateGroupLogic: AdvancedFiltersProps["onUpdateGroupLogic"];
  onRemoveGroup: AdvancedFiltersProps["onRemoveGroup"];
  countries?: AdvancedFiltersProps["countries"];
  isRoot?: boolean;
  t: ReturnType<typeof useTranslation<"crm">>["t"];
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div
      className={`space-y-2 ${
        !isRoot
          ? "ml-4 border-l-2 border-blue-200 pl-4 dark:border-blue-800"
          : ""
      }`}
    >
      {/* Group header with logic toggle */}
      <div className="flex items-center gap-2">
        {!isRoot && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-6 w-6"
          >
            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                isCollapsed ? "-rotate-90" : ""
              }`}
            />
          </Button>
        )}

        {/* Logic selector (AND/OR) */}
        <div className="flex items-center gap-1 rounded-md bg-gray-100 p-0.5 dark:bg-gray-800">
          <button
            type="button"
            onClick={() => onUpdateGroupLogic(group.id, "AND")}
            className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
              group.logic === "AND"
                ? "bg-blue-500 text-white"
                : "text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700"
            }`}
          >
            AND
          </button>
          <button
            type="button"
            onClick={() => onUpdateGroupLogic(group.id, "OR")}
            className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
              group.logic === "OR"
                ? "bg-orange-500 text-white"
                : "text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700"
            }`}
          >
            OR
          </button>
        </div>

        {/* Group actions */}
        {!isRoot && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onRemoveGroup(group.id)}
            className="h-6 w-6 text-gray-400 hover:text-red-500"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {/* Conditions */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            {group.conditions.map((condition) => (
              <FilterRow
                key={condition.id}
                condition={condition}
                onUpdate={(updates) => onUpdateCondition(condition.id, updates)}
                onRemove={() => onRemoveCondition(condition.id)}
                countries={countries}
                canRemove={
                  group.conditions.length > 1 || group.groups.length > 0
                }
              />
            ))}

            {/* Nested groups */}
            {group.groups.map((nestedGroup) => (
              <FilterGroupUI
                key={nestedGroup.id}
                group={nestedGroup}
                onUpdateCondition={onUpdateCondition}
                onRemoveCondition={onRemoveCondition}
                onAddCondition={onAddCondition}
                onAddGroup={onAddGroup}
                onUpdateGroupLogic={onUpdateGroupLogic}
                onRemoveGroup={onRemoveGroup}
                countries={countries}
                t={t}
              />
            ))}

            {/* Add buttons */}
            <div className="flex items-center gap-2 pt-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onAddCondition(group.id)}
                className="h-7 gap-1 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                <Plus className="h-3.5 w-3.5" />
                {t("leads.filters.add_condition")}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onAddGroup(group.id)}
                className="h-7 gap-1 text-xs text-purple-600 hover:text-purple-700 dark:text-purple-400"
              >
                <FolderPlus className="h-3.5 w-3.5" />
                {t("leads.filters.add_group")}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function AdvancedFilters({
  filterGroup,
  isActive,
  conditionsCount,
  onSetLogic: _onSetLogic,
  onReset,
  onAddCondition,
  onUpdateCondition,
  onRemoveCondition,
  onAddGroup,
  onUpdateGroupLogic,
  onRemoveGroup,
  countries,
}: AdvancedFiltersProps) {
  const { t } = useTranslation("crm");
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={isActive ? "default" : "outline"}
          size="sm"
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          {t("leads.filters.advanced")}
          {isActive && (
            <Badge
              variant="secondary"
              className="ml-1 h-5 min-w-[20px] rounded-full bg-white/20 px-1.5 text-xs"
            >
              {conditionsCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="max-h-[70vh] w-[540px] overflow-y-auto p-4"
        align="start"
        sideOffset={8}
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            {t("leads.filters.advanced_title")}
          </h3>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-7 gap-1 text-xs text-gray-500 hover:text-gray-700"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {t("leads.filters.reset_all")}
          </Button>
        </div>

        {/* Filter builder */}
        <FilterGroupUI
          group={filterGroup}
          onUpdateCondition={onUpdateCondition}
          onRemoveCondition={onRemoveCondition}
          onAddCondition={onAddCondition}
          onAddGroup={onAddGroup}
          onUpdateGroupLogic={onUpdateGroupLogic}
          onRemoveGroup={onRemoveGroup}
          countries={countries}
          isRoot
          t={t}
        />

        {/* Footer info */}
        <div className="mt-4 border-t border-gray-200 pt-3 dark:border-gray-700">
          <p className="text-muted-foreground text-xs">
            {t("leads.filters.info_instant")}
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}

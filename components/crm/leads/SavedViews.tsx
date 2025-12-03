"use client";

/**
 * SavedViews - Dropdown pour sélectionner une vue sauvegardée (E2-B)
 * Pattern: Cloudscape AWS Saved Filter Sets
 * @see https://cloudscape.design/patterns/general/filter-patterns/saved-filter-sets/
 */

import { useState } from "react";
import {
  ChevronDown,
  MoreHorizontal,
  Plus,
  Trash2,
  Star,
  Check,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { SaveViewModal } from "./SaveViewModal";
import type { SavedView, SavedViewConfig } from "@/lib/types/views";

interface SavedViewsProps {
  views: SavedView[];
  activeViewId: string | null;
  onSelectView: (id: string) => void;
  onSaveView: (name: string, isDefault: boolean) => void;
  onDeleteView: (id: string) => void;
  onSetDefault: (id: string) => void;
  getCurrentConfig: () => SavedViewConfig;
  advancedConditionsCount: number;
}

export function SavedViews({
  views,
  activeViewId,
  onSelectView,
  onSaveView,
  onDeleteView,
  onSetDefault,
  getCurrentConfig,
  advancedConditionsCount,
}: SavedViewsProps) {
  const { t } = useTranslation("crm");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionsOpenForView, setActionsOpenForView] = useState<string | null>(
    null
  );

  // Get active view
  const activeView = views.find((v) => v.id === activeViewId);
  const activeViewName = activeView
    ? activeView.isBuiltIn
      ? t(`leads.saved_views.builtin.${activeView.id}`, activeView.name)
      : activeView.name
    : t("leads.saved_views.all_leads");

  // Handle delete with confirmation
  const handleDelete = (view: SavedView) => {
    if (view.isBuiltIn) return;
    const confirmed = window.confirm(t("leads.saved_views.delete_confirm"));
    if (confirmed) {
      onDeleteView(view.id);
    }
    setActionsOpenForView(null);
  };

  // Handle set default
  const handleSetDefault = (view: SavedView) => {
    onSetDefault(view.id);
    setActionsOpenForView(null);
  };

  // Handle unset default (set first built-in as default)
  const handleUnsetDefault = (_view: SavedView) => {
    // Set the "all-leads" as default instead
    const allLeadsView = views.find((v) => v.id === "all-leads");
    if (allLeadsView) {
      onSetDefault(allLeadsView.id);
    }
    setActionsOpenForView(null);
  };

  return (
    <>
      {/* Main dropdown for selecting views */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="min-w-[200px] justify-between gap-2"
          >
            <span className="flex items-center gap-2 truncate">
              {activeViewName}
              {activeView?.isDefault && (
                <Badge
                  variant="secondary"
                  className="ml-1 px-1.5 py-0 text-[10px]"
                >
                  {t("leads.saved_views.default_badge")}
                </Badge>
              )}
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-[280px]">
          <DropdownMenuLabel className="text-xs text-gray-500 uppercase">
            {t("leads.saved_views.title")}
          </DropdownMenuLabel>

          {/* Liste des vues */}
          {views.map((view) => {
            const viewName = view.isBuiltIn
              ? t(`leads.saved_views.builtin.${view.id}`, view.name)
              : view.name;
            const isActive = view.id === activeViewId;

            return (
              <div key={view.id} className="flex items-center gap-1 px-1">
                {/* View item - clickable to select */}
                <DropdownMenuItem
                  className="flex-1 cursor-pointer"
                  onClick={() => onSelectView(view.id)}
                >
                  <span className="flex flex-1 items-center gap-2">
                    {/* Check icon for active view */}
                    {isActive ? (
                      <Check className="h-4 w-4 text-blue-600" />
                    ) : (
                      <span className="w-4" />
                    )}

                    <span className={isActive ? "font-medium" : ""}>
                      {viewName}
                    </span>

                    {/* Default badge */}
                    {view.isDefault && (
                      <Badge
                        variant="outline"
                        className="ml-auto border-yellow-400 px-1.5 py-0 text-[10px] text-yellow-600"
                      >
                        {t("leads.saved_views.default_badge")}
                      </Badge>
                    )}
                  </span>
                </DropdownMenuItem>

                {/* Actions menu for each view */}
                <DropdownMenu
                  open={actionsOpenForView === view.id}
                  onOpenChange={(open) =>
                    setActionsOpenForView(open ? view.id : null)
                  }
                >
                  <DropdownMenuTrigger asChild>
                    <button
                      className="rounded p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-4 w-4 text-gray-500" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[180px]">
                    {/* Set/Unset as default */}
                    {view.isDefault ? (
                      <DropdownMenuItem
                        onClick={() => handleUnsetDefault(view)}
                        className="cursor-pointer"
                      >
                        <Star className="mr-2 h-4 w-4" />
                        {t("leads.saved_views.unset_default")}
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem
                        onClick={() => handleSetDefault(view)}
                        className="cursor-pointer"
                      >
                        <Star className="mr-2 h-4 w-4 fill-yellow-400 text-yellow-400" />
                        {t("leads.saved_views.set_default")}
                      </DropdownMenuItem>
                    )}

                    {/* Delete - only for custom views */}
                    {!view.isBuiltIn && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDelete(view)}
                          className="cursor-pointer text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {t("leads.saved_views.delete")}
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
          })}

          <DropdownMenuSeparator />

          {/* Save current view button */}
          <DropdownMenuItem
            className="cursor-pointer text-blue-600 dark:text-blue-400"
            onSelect={() => {
              // Dropdown will close naturally, modal will open
              setIsModalOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            {t("leads.saved_views.save_current")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Modal pour sauvegarder une vue */}
      <SaveViewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={(name, isDefault) => {
          onSaveView(name, isDefault);
          setIsModalOpen(false);
        }}
        currentConfig={getCurrentConfig()}
        advancedConditionsCount={advancedConditionsCount}
        existingViewNames={views.map((v) => v.name)}
      />
    </>
  );
}

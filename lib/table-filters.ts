import {
  type RankingInfo,
  rankItem,
  compareItems,
} from "@tanstack/match-sorter-utils";
import {
  type FilterFn,
  type SortingFn,
  sortingFns,
} from "@tanstack/react-table";

// Extend TanStack Table's FilterMeta type
declare module "@tanstack/react-table" {
  interface FilterMeta {
    itemRank: RankingInfo;
  }
}

export const fuzzyFilter: FilterFn<unknown> = (
  row,
  columnId,
  value,
  addMeta
) => {
  const itemRank = rankItem(row.getValue(columnId), value);
  addMeta({ itemRank });
  return itemRank.passed;
};

/**
 * Filter function for faceted (multi-select) column filters.
 * Checks if the row's column value is included in the selected filter values array.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const facetedFilter: FilterFn<any> = (row, columnId, filterValue) => {
  if (!Array.isArray(filterValue) || filterValue.length === 0) return true;
  const rowValue = row.getValue(columnId);
  return filterValue.includes(String(rowValue));
};

export const fuzzySort: SortingFn<unknown> = (rowA, rowB, columnId) => {
  let dir = 0;
  if (rowA.columnFiltersMeta[columnId]) {
    dir = compareItems(
      rowA.columnFiltersMeta[columnId].itemRank,
      rowB.columnFiltersMeta[columnId].itemRank
    );
  }
  return dir === 0 ? sortingFns.alphanumeric(rowA, rowB, columnId) : dir;
};

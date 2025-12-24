// lib/repositories/crm/index.ts

export { LeadRepository, LEAD_SORT_FIELDS } from "./lead.repository";
export type { LeadWithRelations } from "./lead.repository";
export type { ILeadRepository, Lead } from "./lead.repository.interface";

export {
  OrderRepository,
  ORDER_SORT_FIELDS,
  orderRepository,
} from "./order.repository";
export type {
  Order,
  OrderWithRelations,
  OrderCreateInput,
  OrderUpdateInput,
} from "./order.repository";

export {
  QuoteRepository,
  QUOTE_SORT_FIELDS,
  quoteRepository,
} from "./quote.repository";
export type {
  Quote,
  QuoteItem,
  QuoteWithItems,
  QuoteWithRelations,
  QuoteCreateInput,
  QuoteItemCreateInput,
  QuoteUpdateInput,
  QuoteFilters,
} from "./quote.repository";

export {
  AgreementRepository,
  AGREEMENT_SORT_FIELDS,
  agreementRepository,
} from "./agreement.repository";
export type {
  Agreement,
  AgreementWithRelations,
  AgreementCreateInput,
  AgreementUpdateInput,
  AgreementFilters,
} from "./agreement.repository";

export {
  CrmSettingsRepository,
  SETTINGS_SORT_FIELDS,
  SettingCategory,
  CrmSettingKey,
  seedCrmSettings,
} from "./settings.repository";
export type { CrmSetting, SettingValue } from "./settings.repository";

export { CountryRepository } from "./country.repository";
export type { Country } from "./country.repository";

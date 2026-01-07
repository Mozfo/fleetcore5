// CRM service exports
export { CountryService } from "./country.service";
export { LeadScoringService } from "./lead-scoring.service";
export { LeadAssignmentService } from "./lead-assignment.service";
export { LeadCreationService } from "./lead-creation.service";

// Lead Service (Single Source of Truth for Lead 360)
export { LeadService, leadService } from "./lead.service";

// Order Service
export { OrderService, orderService } from "./order.service";
export type {
  CreateOrderFromOpportunityParams,
  OrderCreationResult,
} from "./order.service";

// Quote Service
export { QuoteService, quoteService } from "./quote.service";
export type {
  CreateQuoteParams,
  CreateQuoteItemParams,
  UpdateQuoteParams,
  SendQuoteResult,
  QuoteConversionResult,
} from "./quote.service";

// Agreement Service
export { AgreementService, agreementService } from "./agreement.service";
export type {
  CreateAgreementParams,
  UpdateAgreementParams,
  RecordClientSignatureParams,
  RecordProviderSignatureParams,
  SendForSignatureResult,
} from "./agreement.service";

// Email Verification Service (V6.2.2 - Book Demo Wizard)
export {
  EmailVerificationService,
  emailVerificationService,
  VERIFICATION_CONSTANTS,
} from "./email-verification.service";
export type {
  SendVerificationResult,
  VerifyCodeResult,
  ResendCheckResult,
} from "./email-verification.service";

export interface QuoteAttachmentProvider{isAvailable():boolean}
export const QUOTE_ATTACHMENT_PROVIDER=Symbol("QUOTE_ATTACHMENT_PROVIDER");
export class DeferredQuoteAttachmentProvider implements QuoteAttachmentProvider{isAvailable(){return false}}

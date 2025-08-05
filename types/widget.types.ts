export interface WidgetTheme {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  borderRadius: string;
  customCss?: string;
  headerText: string;
  headerColor: string;
  headerAlignment: "left" | "center" | "right";
  buttonTextColor: string;
  backgroundColor: string;
}

export interface WidgetConfig {
  theme: WidgetTheme;
  causes: Cause[];
  settings: {
    showProgressBar: boolean;
    showDonorList: boolean;
    allowRecurring: boolean;
    minimumDonation: number;
    suggestedAmounts: number[];
    showCoverFees: boolean;
    defaultFrequency: "one-time" | "monthly" | "yearly";
    paymentMethods?: string[];
    allowBankTransfer?: boolean;
  };
}

export interface Cause {
  id: string;
  name: string;
  description?: string;
  goalAmount?: number;
  raisedAmount: number;
  isActive: boolean;
}

export interface Widget {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  config: WidgetConfig;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

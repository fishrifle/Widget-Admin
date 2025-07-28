export const WIDGET_THEMES = {
  OCEAN_BLUE: {
    name: "Ocean Blue",
    primaryColor: "#0066cc",
    secondaryColor: "#e6f2ff",
  },
  FOREST_GREEN: {
    name: "Forest Green",
    primaryColor: "#228b22",
    secondaryColor: "#e6f5e6",
  },
  SUNSET_ORANGE: {
    name: "Sunset Orange",
    primaryColor: "#ff6347",
    secondaryColor: "#ffe6e1",
  },
  ROYAL_PURPLE: {
    name: "Royal Purple",
    primaryColor: "#6a0dad",
    secondaryColor: "#f0e6ff",
  },
  MINIMAL_BLACK: {
    name: "Minimal Black",
    primaryColor: "#000000",
    secondaryColor: "#f5f5f5",
  },
};

export const FONT_OPTIONS = [
  { value: "inter", label: "Inter" },
  { value: "roboto", label: "Roboto" },
  { value: "opensans", label: "Open Sans" },
  { value: "montserrat", label: "Montserrat" },
  { value: "lato", label: "Lato" },
  { value: "poppins", label: "Poppins" },
];

export const BORDER_RADIUS_OPTIONS = [
  { value: "0px", label: "None" },
  { value: "4px", label: "Small" },
  { value: "8px", label: "Medium" },
  { value: "12px", label: "Large" },
  { value: "16px", label: "Extra Large" },
];

export const DEFAULT_WIDGET_CONFIG = {
  theme: {
    primaryColor: "#0066cc",
    secondaryColor: "#e6f2ff",
    fontFamily: "inter",
    borderRadius: "8px",
    customCss: "",
  },
  causes: [],
  settings: {
    showProgressBar: true,
    showDonorList: false,
    allowRecurring: true,
    minimumDonation: 5,
    suggestedAmounts: [10, 25, 50, 100],
  },
};

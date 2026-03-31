import { type ChipGroup } from "@/components/ui/CustomChipSelect";

export const COUNTRY_GROUPS: ChipGroup[] = [
  {
    group: "West Africa",
    options: [
      "Nigeria", "Ghana", "Senegal", "Côte d'Ivoire", "Cameroon", "Mali",
      "Togo", "Benin", "Guinea", "Sierra Leone", "Liberia",
      "Burkina Faso", "Niger", "Gambia", "Guinea-Bissau", "Cape Verde", "Mauritania",
    ],
  },
  {
    group: "East Africa",
    options: [
      "Kenya", "Ethiopia", "Uganda", "Tanzania", "Rwanda", "Somalia",
      "Eritrea", "Djibouti", "Burundi", "South Sudan",
      "Madagascar", "Comoros", "Seychelles", "Mauritius",
    ],
  },
  {
    group: "Southern Africa",
    options: [
      "South Africa", "Zimbabwe", "Zambia", "Botswana", "Mozambique",
      "Malawi", "Namibia", "Lesotho", "Eswatini", "Angola",
    ],
  },
  {
    group: "North Africa",
    options: ["Egypt", "Morocco", "Tunisia", "Algeria", "Sudan", "Libya"],
  },
  {
    group: "Central Africa",
    options: [
      "DR Congo", "Republic of Congo", "Chad", "Gabon",
      "Central African Republic", "Equatorial Guinea", "São Tomé and Príncipe",
    ],
  },
  {
    group: "Diaspora",
    options: [
      "United Kingdom", "United States", "Canada", "Australia",
      "France", "Germany", "Netherlands", "Ireland",
      "Belgium", "Portugal", "Italy", "Spain",
      "Sweden", "Norway", "Denmark", "Switzerland",
      "New Zealand", "UAE", "Saudi Arabia",
    ],
  },
];

export const ALL_COUNTRIES: string[] = COUNTRY_GROUPS.flatMap(g => g.options);

export const AFRICAN_COUNTRIES: string[] = COUNTRY_GROUPS
  .filter(g => g.group !== "Diaspora")
  .flatMap(g => g.options);

export const RESIDENCE_COUNTRIES: string[] = ALL_COUNTRIES;

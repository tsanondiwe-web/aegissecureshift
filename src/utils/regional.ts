import { Tenant } from '../types';

export interface SouthernAfricaRegion {
  countryCode: string;
  countryName: string;
  locale: string;
  currencies: string[];
}

export const SOUTHERN_AFRICA_REGIONS: SouthernAfricaRegion[] = [
  { countryCode: 'AO', countryName: 'Angola', locale: 'pt-AO', currencies: ['AOA', 'USD'] },
  { countryCode: 'BW', countryName: 'Botswana', locale: 'en-BW', currencies: ['BWP', 'USD'] },
  { countryCode: 'KM', countryName: 'Comoros', locale: 'fr-KM', currencies: ['KMF', 'EUR'] },
  { countryCode: 'CD', countryName: 'DR Congo', locale: 'fr-CD', currencies: ['CDF', 'USD'] },
  { countryCode: 'SZ', countryName: 'Eswatini', locale: 'en-SZ', currencies: ['SZL', 'ZAR'] },
  { countryCode: 'LS', countryName: 'Lesotho', locale: 'en-LS', currencies: ['LSL', 'ZAR'] },
  { countryCode: 'MG', countryName: 'Madagascar', locale: 'fr-MG', currencies: ['MGA', 'EUR'] },
  { countryCode: 'MW', countryName: 'Malawi', locale: 'en-MW', currencies: ['MWK', 'USD'] },
  { countryCode: 'MU', countryName: 'Mauritius', locale: 'en-MU', currencies: ['MUR', 'USD'] },
  { countryCode: 'MZ', countryName: 'Mozambique', locale: 'pt-MZ', currencies: ['MZN', 'USD'] },
  { countryCode: 'NA', countryName: 'Namibia', locale: 'en-NA', currencies: ['NAD', 'ZAR'] },
  { countryCode: 'SC', countryName: 'Seychelles', locale: 'en-SC', currencies: ['SCR', 'USD', 'EUR'] },
  { countryCode: 'ZA', countryName: 'South Africa', locale: 'en-ZA', currencies: ['ZAR', 'USD'] },
  { countryCode: 'TZ', countryName: 'Tanzania', locale: 'en-TZ', currencies: ['TZS', 'USD'] },
  { countryCode: 'ZM', countryName: 'Zambia', locale: 'en-ZM', currencies: ['ZMW', 'USD'] },
  { countryCode: 'ZW', countryName: 'Zimbabwe', locale: 'en-ZW', currencies: ['ZWG', 'USD', 'ZAR'] },
];

export const getTenantRegion = (tenant: Pick<Tenant, 'countryCode' | 'currencyCode' | 'locale'>) => {
  const region = SOUTHERN_AFRICA_REGIONS.find((item) => item.countryCode === tenant.countryCode)
    || SOUTHERN_AFRICA_REGIONS.find((item) => item.countryCode === 'ZA')!;
  return {
    region,
    countryCode: tenant.countryCode || region.countryCode,
    currencyCode: tenant.currencyCode || region.currencies[0],
    locale: tenant.locale || region.locale,
  };
};

export const formatCurrency = (
  amount: number,
  tenant: Pick<Tenant, 'countryCode' | 'currencyCode' | 'locale'>,
  options: Intl.NumberFormatOptions = {}
) => {
  const { currencyCode, locale } = getTenantRegion(tenant);
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      maximumFractionDigits: 2,
      ...options,
    }).format(amount);
  } catch {
    return `${currencyCode} ${amount.toLocaleString(undefined, options)}`;
  }
};

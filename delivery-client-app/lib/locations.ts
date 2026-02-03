export interface City {
  name: string;
}

export interface Region {
  name: string;
  cities: City[];
}

export interface Country {
  name: string;
  code: string;
  regions: Region[];
}

export const countries: Country[] = [
  {
    name: "Cameroun",
    code: "CM",
    regions: [
      {
        name: "Centre",
        cities: [
          { name: "Yaoundé" },
          { name: "Mbalmayo" },
          { name: "Obala" },
          { name: "Bafia" },
          { name: "Akonolinga" },
          { name: "Nanga-Eboko" },
        ],
      },
      {
        name: "Littoral",
        cities: [
          { name: "Douala" },
          { name: "Edéa" },
          { name: "Nkongsamba" },
          { name: "Dibombari" },
          { name: "Manoka" },
        ],
      },
      {
        name: "Ouest",
        cities: [
          { name: "Bafoussam" },
          { name: "Dschang" },
          { name: "Mbouda" },
          { name: "Foumban" },
          { name: "Bangangté" },
          { name: "Bafang" },
        ],
      },
      {
        name: "Nord-Ouest",
        cities: [
          { name: "Bamenda" },
          { name: "Kumbo" },
          { name: "Wum" },
          { name: "Ndop" },
          { name: "Nkambe" },
        ],
      },
      {
        name: "Sud-Ouest",
        cities: [
          { name: "Buea" },
          { name: "Limbé" },
          { name: "Kumba" },
          { name: "Mamfe" },
          { name: "Tiko" },
          { name: "Muyuka" },
        ],
      },
      {
        name: "Adamaoua",
        cities: [
          { name: "Ngaoundéré" },
          { name: "Meiganga" },
          { name: "Tibati" },
          { name: "Tignère" },
          { name: "Banyo" },
        ],
      },
      {
        name: "Est",
        cities: [
          { name: "Bertoua" },
          { name: "Abong-Mbang" },
          { name: "Batouri" },
          { name: "Yokadouma" },
          { name: "Ndelele" },
        ],
      },
      {
        name: "Nord",
        cities: [
          { name: "Garoua" },
          { name: "Guider" },
          { name: "Figuil" },
          { name: "Poli" },
          { name: "Tcholliré" },
        ],
      },
      {
        name: "Extrême-Nord",
        cities: [
          { name: "Maroua" },
          { name: "Mokolo" },
          { name: "Kousseri" },
          { name: "Yagoua" },
          { name: "Mora" },
        ],
      },
      {
        name: "Sud",
        cities: [
          { name: "Ebolowa" },
          { name: "Kribi" },
          { name: "Sangmélima" },
          { name: "Ambam" },
          { name: "Lolodorf" },
        ],
      },
    ],
  },
  {
    name: "Nigeria",
    code: "NG",
    regions: [
      {
        name: "Lagos",
        cities: [
          { name: "Lagos" },
          { name: "Ikeja" },
          { name: "Ikorodu" },
          { name: "Badagry" },
          { name: "Epe" },
          { name: "Lekki" },
        ],
      },
      {
        name: "Abuja (FCT)",
        cities: [
          { name: "Abuja" },
          { name: "Gwagwalada" },
          { name: "Kuje" },
          { name: "Bwari" },
          { name: "Kwali" },
        ],
      },
      {
        name: "Rivers",
        cities: [
          { name: "Port Harcourt" },
          { name: "Bonny" },
          { name: "Okrika" },
          { name: "Degema" },
          { name: "Eleme" },
        ],
      },
      {
        name: "Kano",
        cities: [
          { name: "Kano" },
          { name: "Wudil" },
          { name: "Bichi" },
          { name: "Gwarzo" },
          { name: "Rano" },
        ],
      },
      {
        name: "Oyo",
        cities: [
          { name: "Ibadan" },
          { name: "Ogbomosho" },
          { name: "Oyo" },
          { name: "Iseyin" },
          { name: "Saki" },
        ],
      },
      {
        name: "Kaduna",
        cities: [
          { name: "Kaduna" },
          { name: "Zaria" },
          { name: "Kafanchan" },
          { name: "Kachia" },
          { name: "Kagoro" },
        ],
      },
      {
        name: "Delta",
        cities: [
          { name: "Warri" },
          { name: "Asaba" },
          { name: "Sapele" },
          { name: "Ughelli" },
          { name: "Agbor" },
        ],
      },
      {
        name: "Anambra",
        cities: [
          { name: "Onitsha" },
          { name: "Awka" },
          { name: "Nnewi" },
          { name: "Ekwulobia" },
          { name: "Ihiala" },
        ],
      },
      {
        name: "Cross River",
        cities: [
          { name: "Calabar" },
          { name: "Ikom" },
          { name: "Ogoja" },
          { name: "Obudu" },
          { name: "Ugep" },
        ],
      },
      {
        name: "Enugu",
        cities: [
          { name: "Enugu" },
          { name: "Nsukka" },
          { name: "Oji River" },
          { name: "Agbani" },
          { name: "Awgu" },
        ],
      },
    ],
  },
];

export function getCountries(): Country[] {
  return countries;
}

export function getRegionsByCountry(countryName: string): Region[] {
  const country = countries.find((c) => c.name === countryName);
  return country?.regions || [];
}

export function getCitiesByRegion(
  countryName: string,
  regionName: string
): City[] {
  const country = countries.find((c) => c.name === countryName);
  const region = country?.regions.find((r) => r.name === regionName);
  return region?.cities || [];
}

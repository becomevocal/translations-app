export const defaultLocale:string = 'en';

export const availableLocales:Array<{code:string, label: string}> = [
  {
    code: 'en',
    label: 'English',
  },{
    code: 'es',
    label: 'Spanish',
  },{
    code: 'fr',
    label: 'French',
  },
];

export const translatableProductFields:Array<{key:string, labelKey: string, type: "input" | "textarea" | "optionsList" | "customFieldsList" | "modifiersList", graphqlParentObject: string, required: boolean}> = [
  {
    key: 'name',
    labelKey: 'products.form.fields.name',
    type: 'input',
    graphqlParentObject: "basicInformation",
    required: true,
  },
  {
    key: 'description',
    labelKey: 'products.form.fields.description',
    type: 'textarea',
    graphqlParentObject: "basicInformation",
    required: true,
  },
  {
    key: 'pageTitle',
    labelKey: 'products.form.fields.pageTitle',
    type: 'input',
    graphqlParentObject: "seoInformation",
    required: false,
  },
  {
    key: 'metaDescription',
    labelKey: 'products.form.fields.metaDescription',
    type: 'input',
    graphqlParentObject: "seoInformation",
    required: false,
  },
  {
    key: "preOrderMessage",
    labelKey: "products.form.fields.preOrderMessage",
    type: "input",
    required: false,
    graphqlParentObject: "preOrderSettings"
  },
  {
    key: "warranty",
    labelKey: "products.form.fields.warranty",
    type: "input", 
    required: false,
    graphqlParentObject: "storefrontDetails"
  },
  {
    key: "availabilityDescription",
    labelKey: "products.form.fields.availabilityDescription",
    type: "input",
    required: false,
    graphqlParentObject: "storefrontDetails"
  },
  {
    key: "searchKeywords",
    labelKey: "products.form.fields.searchKeywords",
    type: "input",
    required: false,
    graphqlParentObject: "storefrontDetails"
  },
  {
    key: 'options',
    labelKey: 'products.form.fields.options',
    type: 'optionsList',
    graphqlParentObject: "options",
    required: false,
  },
  {
    key: 'modifiers',
    labelKey: 'products.form.fields.modifiers',
    type: 'modifiersList',
    graphqlParentObject: "modifiers",
    required: false,
  },
  {
    key: 'customFields',
    labelKey: 'products.form.fields.customFields',
    type: 'customFieldsList',
    graphqlParentObject: "customFields",
    required: false,
  },
];

export const hardcodedAvailableLocales = [
      {
          "id": "aa",
          "name": "Afar",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "ab",
          "name": "Abkhazian",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "ae",
          "name": "Avestan",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "af",
          "name": "Afrikaans",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "ak",
          "name": "Akan",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "am",
          "name": "Amharic",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "an",
          "name": "Aragonese",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "ar",
          "name": "Arabic / العربية",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "as",
          "name": "Assamese",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "av",
          "name": "Avaric",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "ay",
          "name": "Aymara",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "az",
          "name": "Azerbaijani",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "ba",
          "name": "Bashkir",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "be",
          "name": "Belarusian",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "bg",
          "name": "Bulgarian",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "bh",
          "name": "Bihari languages",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "bi",
          "name": "Bislama",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "bm",
          "name": "Bambara",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "bn",
          "name": "Bengali",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "bo",
          "name": "Tibetan",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "br",
          "name": "Breton",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "bs",
          "name": "Bosnian",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "ca",
          "name": "Catalan; Valencian",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "ce",
          "name": "Chechen",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "ch",
          "name": "Chamorro",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "co",
          "name": "Corsican",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "cr",
          "name": "Cree",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "cs",
          "name": "Czech",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "cu",
          "name": "Church Slavic; Old Slavonic; Church Slavonic; Old Bulgarian; Old Church Slavonic",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "cv",
          "name": "Chuvash",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "cy",
          "name": "Welsh",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "da",
          "name": "Danish / Dansk",
          "is_supported": true,
          "fallback": null
      },
      {
          "id": "de",
          "name": "German / Deutsch",
          "is_supported": true,
          "fallback": null
      },
      {
          "id": "de-CH",
          "name": "German; Switzerland / Schweizerdeutsch",
          "is_supported": true,
          "fallback": "de"
      },
      {
          "id": "dv",
          "name": "Divehi; Dhivehi; Maldivian",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "dz",
          "name": "Dzongkha",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "ee",
          "name": "Ewe",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "el",
          "name": "Greek, Modern (1453-)",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "en",
          "name": "English",
          "is_supported": true,
          "fallback": null
      },
      {
          "id": "eo",
          "name": "Esperanto",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "es",
          "name": "Spanish; Castilian / Español/Castellano",
          "is_supported": true,
          "fallback": null
      },
      {
          "id": "es-AR",
          "name": "Spanish; Argentina / Español rioplatense",
          "is_supported": true,
          "fallback": null
      },
      {
          "id": "es-CL",
          "name": "Spanish; Chile / Español chileno",
          "is_supported": true,
          "fallback": null
      },
      {
          "id": "es-CO",
          "name": "Spanish; Colombia / Español colombiano",
          "is_supported": true,
          "fallback": null
      },
      {
          "id": "es-MX",
          "name": "Spanish; Mexico / Español mexicano",
          "is_supported": true,
          "fallback": null
      },
      {
          "id": "es-PE",
          "name": "Spanish; Peru / Español peruano",
          "is_supported": true,
          "fallback": null
      },
      {
          "id": "es-419",
          "name": "Spanish Latin America / Español Latinoamérica",
          "is_supported": true,
          "fallback": null
      },
      {
          "id": "et",
          "name": "Estonian",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "eu",
          "name": "Basque",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "fa",
          "name": "Persian",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "ff",
          "name": "Fulah",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "fi",
          "name": "Finnish",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "fj",
          "name": "Fijian",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "fo",
          "name": "Faroese",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "fr",
          "name": "French / Français",
          "is_supported": true,
          "fallback": null
      },
      {
          "id": "fr-CA",
          "name": "French; Canada / Français de Canada",
          "is_supported": true,
          "fallback": "fr"
      },
      {
          "id": "fr-BE",
          "name": "French; Belgium / Français de Belgique",
          "is_supported": true,
          "fallback": "fr"
      },
      {
          "id": "fr-CH",
          "name": "French; Switzerland / Français de Suisse",
          "is_supported": true,
          "fallback": "fr"
      },
      {
          "id": "fy",
          "name": "Western Frisian",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "ga",
          "name": "Irish",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "gd",
          "name": "Gaelic; Scottish Gaelic",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "gl",
          "name": "Galician",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "gn",
          "name": "Guarani",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "gu",
          "name": "Gujarati",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "gv",
          "name": "Manx",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "ha",
          "name": "Hausa",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "he",
          "name": "Hebrew / עברית",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "hi",
          "name": "Hindi / िंदी",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "ho",
          "name": "Hiri Motu",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "hr",
          "name": "Croatian",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "ht",
          "name": "Haitian; Haitian Creole",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "hu",
          "name": "Hungarian",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "hy",
          "name": "Armenian",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "hz",
          "name": "Herero",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "ia",
          "name": "Interlingua (International Auxiliary Language Association)",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "id",
          "name": "Indonesian",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "ie",
          "name": "Interlingue; Occidental",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "ig",
          "name": "Igbo",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "ii",
          "name": "Sichuan Yi; Nuosu",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "ik",
          "name": "Inupiaq",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "io",
          "name": "Ido",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "is",
          "name": "Icelandic",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "it",
          "name": "Italian / Italiano",
          "is_supported": true,
          "fallback": null
      },
      {
          "id": "it-CH",
          "name": "Italian; Switzerland / Utaliano svizzero",
          "is_supported": true,
          "fallback": "it"
      },
      {
          "id": "iu",
          "name": "Inuktitut",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "ja",
          "name": "Japanese / 日本語‫",
          "is_supported": true,
          "fallback": null
      },
      {
          "id": "jv",
          "name": "Javanese",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "ka",
          "name": "Georgian",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "kg",
          "name": "Kongo",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "ki",
          "name": "Kikuyu; Gikuyu",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "kj",
          "name": "Kuanyama; Kwanyama",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "kk",
          "name": "Kazakh",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "kl",
          "name": "Kalaallisut; Greenlandic",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "km",
          "name": "Central Khmer",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "kn",
          "name": "Kannada",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "ko",
          "name": "Korean / 한국어‫",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "kr",
          "name": "Kanuri",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "ks",
          "name": "Kashmiri",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "ku",
          "name": "Kurdish",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "kv",
          "name": "Komi",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "kw",
          "name": "Cornish",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "ky",
          "name": "Kirghiz; Kyrgyz",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "la",
          "name": "Latin",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "lb",
          "name": "Luxembourgish; Letzeburgesch",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "lg",
          "name": "Ganda",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "li",
          "name": "Limburgan; Limburger; Limburgish",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "ln",
          "name": "Lingala",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "lo",
          "name": "Lao",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "lt",
          "name": "Lithuanian",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "lu",
          "name": "Luba-Katanga",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "lv",
          "name": "Latvian",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "mg",
          "name": "Malagasy",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "mh",
          "name": "Marshallese",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "mi",
          "name": "Maori",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "mk",
          "name": "Macedonian",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "ml",
          "name": "Malayalam",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "mn",
          "name": "Mongolian",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "mr",
          "name": "Marathi",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "ms",
          "name": "Malay",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "mt",
          "name": "Maltese",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "my",
          "name": "Burmese",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "na",
          "name": "Nauru",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "nb",
          "name": "Bokmål, Norwegian; Norwegian Bokmål / Norsk; bokmål",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "nd",
          "name": "Ndebele, North; North Ndebele",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "ne",
          "name": "Nepali",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "ng",
          "name": "Ndonga",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "nl",
          "name": "Dutch; Flemish / Nederlands",
          "is_supported": true,
          "fallback": null
      },
      {
          "id": "nn",
          "name": "Norwegian Nynorsk; Nynorsk, Norwegian / Norsk; nynorsk",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "no",
          "name": "Norwegian / Norsk",
          "is_supported": true,
          "fallback": null
      },
      {
          "id": "nr",
          "name": "Ndebele, South; South Ndebele",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "nv",
          "name": "Navajo; Navaho",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "ny",
          "name": "Chichewa; Chewa; Nyanja",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "oc",
          "name": "Occitan",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "oj",
          "name": "Ojibwa",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "om",
          "name": "Oromo",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "or",
          "name": "Oriya",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "os",
          "name": "Ossetian; Ossetic",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "pa",
          "name": "Panjabi; Punjabi",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "pi",
          "name": "Pali",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "pl",
          "name": "Polish",
          "is_supported": true,
          "fallback": null
      },
      {
          "id": "ps",
          "name": "Pushto; Pashto",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "pt",
          "name": "Portuguese / Português",
          "is_supported": true,
          "fallback": null
      },
      {
          "id": "qu",
          "name": "Quechua",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "rm",
          "name": "Romansh",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "rn",
          "name": "Rundi",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "ro",
          "name": "Romanian; Moldavian; Moldovan",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "ru",
          "name": "Russian",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "rw",
          "name": "Kinyarwanda",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "sa",
          "name": "Sanskrit",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "sc",
          "name": "Sardinian",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "sd",
          "name": "Sindhi",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "se",
          "name": "Northern Sami",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "sg",
          "name": "Sango",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "si",
          "name": "Sinhala; Sinhalese",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "sk",
          "name": "Slovak",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "sl",
          "name": "Slovenian",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "sm",
          "name": "Samoan",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "sn",
          "name": "Shona",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "so",
          "name": "Somali",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "sq",
          "name": "Albanian",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "sr",
          "name": "Serbian",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "ss",
          "name": "Swati",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "st",
          "name": "Sotho, Southern",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "su",
          "name": "Sundanese",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "sv",
          "name": "Swedish / Svenska",
          "is_supported": true,
          "fallback": null
      },
      {
          "id": "sw",
          "name": "Swahili",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "ta",
          "name": "Tamil",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "te",
          "name": "Telugu",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "tg",
          "name": "Tajik",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "th",
          "name": "Thai",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "ti",
          "name": "Tigrinya",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "tk",
          "name": "Turkmen",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "tl",
          "name": "Tagalog",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "tn",
          "name": "Tswana",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "to",
          "name": "Tonga (Tonga Islands)",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "tr",
          "name": "Turkish",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "ts",
          "name": "Tsonga",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "tt",
          "name": "Tatar",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "tw",
          "name": "Twi",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "ty",
          "name": "Tahitian",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "ug",
          "name": "Uighur; Uyghur",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "uk",
          "name": "Ukrainian",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "ur",
          "name": "Urdu",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "uz",
          "name": "Uzbek",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "ve",
          "name": "Venda",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "vi",
          "name": "Vietnamese / Tiếng Việt",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "vo",
          "name": "Volapük",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "wa",
          "name": "Walloon",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "wo",
          "name": "Wolof",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "xh",
          "name": "Xhosa",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "yi",
          "name": "Yiddish",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "yo",
          "name": "Yoruba",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "za",
          "name": "Zhuang; Chuang",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "zh",
          "name": "Chinese / 中文",
          "is_supported": false,
          "fallback": null
      },
      {
          "id": "zu",
          "name": "Zulu",
          "is_supported": false,
          "fallback": null
      }
  ]
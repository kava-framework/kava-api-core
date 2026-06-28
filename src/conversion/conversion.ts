import { date } from './date'

export const conversion = {
  // =====================================>
  // ## Conversion: format string to snake case
  // =====================================>
  strSnake(value: string, delimiter: string = "_"): string {
    return toWords(value).join(delimiter)
  },

  // =====================================>
  // ## Conversion: format string to slug
  // =====================================>
  strSlug(value: string, delimiter: string = "-"): string {
    return toWords(value).join(delimiter);
  },

  // =====================================>
  // ## Conversion: format string to camel case
  // =====================================>
  strCamel(value: string, delimiter: string = ""): string {
    return toWords(value).map((w, i) => i === 0 ? w : w[0].toUpperCase() + w.slice(1)).join(delimiter);
  },

  // =====================================>
  // ## Conversion: format string to pascal case
  // =====================================>
  strPascal(value: string, delimiter: string = ""): string {
    return toWords(value).map(w => w[0].toUpperCase() + w.slice(1)).join(delimiter);
  },

  // =====================================>
  // ## Conversion: format string to plural
  // =====================================>
  strPlural(value: string): string {
    const match = value.match(/^(.*?)([A-Za-z]+)$/)
    if (!match) return value

    const [, prefix, word] = match

    if (word.endsWith("y") && !/[aeiou]y$/i.test(word)) {
      return prefix + word.slice(0, -1) + "ies"
    }

    if (!word.endsWith("s")) return prefix + word + "s"

    return value
  },

  // =====================================>
  // ## Conversion: format string to singular
  // =====================================>
  strSingular(value: string): string {
    const match = value.match(/^(.*?)([A-Za-z]+)$/)
    if (!match) return value

    const [, prefix, word] = match

    if (word.endsWith("ies")) {
      return prefix + word.slice(0, -3) + "y"
    }

    if (word.endsWith("s") && !word.endsWith("ss")) {
      return prefix + word.slice(0, -1)
    }

    return value
  },

  // =====================================>
  // ## Conversion: format number to currency
  // =====================================>
  currency: (value: number, locale = "id-ID", currency = "IDR") => { const val = Math.trunc(value); return new Intl.NumberFormat(locale, { style: "currency", currency, minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(val); }, 
  
  // =====================================>
  // ## Conversion: format date string
  // =====================================>
  date: date,
};



function toWords(value: string): string[] {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_\-\s]+/g, " ")
    .trim()
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
}
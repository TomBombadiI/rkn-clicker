const WHOLE_NUMBER_FORMATTER = new Intl.NumberFormat("ru-RU", {
  maximumFractionDigits: 0,
});

const DECIMAL_NUMBER_FORMATTER = new Intl.NumberFormat("ru-RU", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

const COMPACT_SUFFIXES = ["", "K", "M", "B", "T", "Qa", "Qi"] as const;

export function formatCompactNumber(value: number): string {
  const absoluteValue = Math.abs(value);

  if (absoluteValue < 1000) {
    return WHOLE_NUMBER_FORMATTER.format(value);
  }

  let suffixIndex = 0;
  let compactValue = absoluteValue;

  while (compactValue >= 1000 && suffixIndex < COMPACT_SUFFIXES.length - 1) {
    compactValue /= 1000;
    suffixIndex += 1;
  }

  const formattedValue =
    compactValue >= 100
      ? WHOLE_NUMBER_FORMATTER.format(compactValue)
      : DECIMAL_NUMBER_FORMATTER.format(compactValue);

  const sign = value < 0 ? "-" : "";
  return `${sign}${formattedValue}${COMPACT_SUFFIXES[suffixIndex]}`;
}

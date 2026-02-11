export function buildPremiseTextFromFormValues(
  premise1Value: FormDataEntryValue | null,
  premise2Value: FormDataEntryValue | null,
  premiseTextValue: FormDataEntryValue | null
) {
  const premise1 = String(premise1Value ?? "").trim();
  const premise2 = String(premise2Value ?? "").trim();
  const premiseText = String(premiseTextValue ?? "").trim();

  if (premise1 || premise2) return `${premise1}\n${premise2}`;
  return premiseText;
}

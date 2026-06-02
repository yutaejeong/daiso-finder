export function formatDaisoBranchName(name: string) {
  return name.startsWith("다이소") ? name : `다이소 ${name}`;
}

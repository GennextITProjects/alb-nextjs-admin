// utils/common-function.ts
export const IndianRupee = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount);
};

export const secondsToHMS = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
};

export const DeepSearchSpace = <T extends Record<string, any>>(data: T[], searchText: string): T[] => {
  if (!searchText) return data;
  
  const searchLower = searchText.toLowerCase();
  return data.filter(item =>
    Object.values(item).some(value =>
      value?.toString().toLowerCase().includes(searchLower)
    )
  );
};
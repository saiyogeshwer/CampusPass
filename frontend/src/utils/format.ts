import { formatEther } from "ethers";
export const shortAddress = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;
export const eth = (wei: bigint) => `${Number(formatEther(wei)).toLocaleString(undefined, { maximumFractionDigits: 6 })} ETH`;
export const fmtDate = (unix: bigint | number) => new Date(Number(unix) * 1000).toLocaleString();

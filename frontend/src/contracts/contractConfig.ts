// Single source of truth: ABI, chain IDs, contract address, explorer URLs.
import abi from "./CampusPassABI.json";

const deployments = import.meta.glob("./deployment.*.json", { eager: true, import: "default" }) as Record<
  string, { address: string; chainId: number; txHash: string }
>;

export const SEPOLIA_CHAIN_ID = 11155111;
export const LOCAL_CHAIN_ID = 31337;
export const TARGET_CHAIN_ID = Number(import.meta.env.VITE_CHAIN_ID ?? SEPOLIA_CHAIN_ID);
export const CAMPUSPASS_ABI = abi;

export function getContractAddress(chainId: number): string | null {
  if (chainId === TARGET_CHAIN_ID && import.meta.env.VITE_CONTRACT_ADDRESS) return import.meta.env.VITE_CONTRACT_ADDRESS;
  const d = Object.values(deployments).find((x) => x.chainId === chainId);
  return d?.address ?? null;
}
export const chainName = (id: number) => (id === SEPOLIA_CHAIN_ID ? "Sepolia" : id === LOCAL_CHAIN_ID ? "Hardhat Local" : `Chain ${id}`);
export const txUrl = (hash: string, chainId = TARGET_CHAIN_ID) =>
  chainId === SEPOLIA_CHAIN_ID ? `https://sepolia.etherscan.io/tx/${hash}` : null;
export const addressUrl = (a: string, chainId = TARGET_CHAIN_ID) =>
  chainId === SEPOLIA_CHAIN_ID ? `https://sepolia.etherscan.io/address/${a}` : null;

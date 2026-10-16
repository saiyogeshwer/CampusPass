import { useCallback, useEffect, useState } from "react";
import { BrowserProvider, JsonRpcSigner } from "ethers";
import { SEPOLIA_CHAIN_ID, TARGET_CHAIN_ID } from "../contracts/contractConfig";

declare global { interface Window { ethereum?: any } }

export function useWallet() {
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState<bigint>(0n);
  const [chainId, setChainId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!window.ethereum) return;
    if (localStorage.getItem("cp_disconnected") === "1") return; // app-level disconnect only
    const p = new BrowserProvider(window.ethereum);
    const accounts: string[] = await p.send("eth_accounts", []);
    const net = await p.getNetwork();
    setChainId(Number(net.chainId));
    if (!accounts.length) { setAccount(null); setSigner(null); return; }
    setProvider(p); setSigner(await p.getSigner()); setAccount(accounts[0]);
    setBalance(await p.getBalance(accounts[0]));
  }, []);

  useEffect(() => {
    load();
    const eth = window.ethereum;
    if (!eth) return;
    eth.on("accountsChanged", load); eth.on("chainChanged", load);
    return () => { eth.removeListener("accountsChanged", load); eth.removeListener("chainChanged", load); };
  }, [load]);

  const connect = async () => {
    setError(null);
    if (!window.ethereum) { setError("MetaMask not found. Install the MetaMask extension."); return; }
    try {
      localStorage.removeItem("cp_disconnected");
      await new BrowserProvider(window.ethereum).send("eth_requestAccounts", []);
      await load();
    } catch (e: any) { setError(e?.code === 4001 ? "Connection request rejected." : "Could not connect wallet."); }
  };
  const disconnect = () => { // A dapp cannot force-disconnect MetaMask; this ends the app session.
    localStorage.setItem("cp_disconnected", "1");
    setAccount(null); setSigner(null); setProvider(null); setBalance(0n);
  };
  const switchNetwork = async () => {
    const hex = "0x" + TARGET_CHAIN_ID.toString(16);
    try { await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: hex }] }); }
    catch (e: any) {
      if (e?.code === 4902 && TARGET_CHAIN_ID === SEPOLIA_CHAIN_ID)
        await window.ethereum.request({ method: "wallet_addEthereumChain", params: [{ chainId: hex, chainName: "Sepolia",
          nativeCurrency: { name: "Sepolia ETH", symbol: "ETH", decimals: 18 }, rpcUrls: ["https://rpc.sepolia.org"], blockExplorerUrls: ["https://sepolia.etherscan.io"] }] });
      else setError("Could not switch network.");
    }
  };
  return { provider, signer, account, balance, chainId, error, connect, disconnect, switchNetwork,
    wrongNetwork: !!account && chainId !== TARGET_CHAIN_ID, refreshBalance: load };
}
export type Wallet = ReturnType<typeof useWallet>;

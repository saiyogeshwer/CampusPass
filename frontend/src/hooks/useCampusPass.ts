import { useCallback, useMemo, useState } from "react";
import { Contract } from "ethers";
import { CAMPUSPASS_ABI, getContractAddress } from "../contracts/contractConfig";
import { friendlyError } from "../utils/errors";
import type { Wallet } from "./useWallet";

export type TxState = { phase: "idle" | "wallet" | "submitted" | "confirming" | "confirmed" | "failed"; hash?: string; message?: string };

export function useCampusPass(w: Wallet) {
  const address = w.chainId ? getContractAddress(w.chainId) : null;
  const read = useMemo(() => (address && w.provider ? new Contract(address, CAMPUSPASS_ABI, w.provider) : null), [address, w.provider]);
  const write = useMemo(() => (address && w.signer ? new Contract(address, CAMPUSPASS_ABI, w.signer) : null), [address, w.signer]);
  const [tx, setTx] = useState<TxState>({ phase: "idle" });
  const pending = ["wallet", "submitted", "confirming"].includes(tx.phase);

  /** Runs a write call through the full lifecycle. Never reports success before the receipt. */
  const run = useCallback(async (label: string, fn: (c: Contract) => Promise<any>, onDone?: () => void) => {
    if (!write || pending) return false;
    setTx({ phase: "wallet", message: label });
    try {
      const sent = await fn(write);
      setTx({ phase: "confirming", hash: sent.hash, message: label });
      const receipt = await sent.wait();
      if (receipt?.status !== 1) throw new Error("Transaction reverted");
      setTx({ phase: "confirmed", hash: sent.hash, message: label });
      await w.refreshBalance(); onDone?.();
      return true;
    } catch (e) {
      setTx({ phase: "failed", message: friendlyError(e, write.interface) });
      return false;
    }
  }, [write, pending, w]);

  return { address, read, write, tx, pending, run, resetTx: () => setTx({ phase: "idle" }) };
}
export type CP = ReturnType<typeof useCampusPass>;

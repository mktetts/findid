import { EphemeralKeyPair } from "@aptos-labs/ts-sdk";
import { create } from "zustand";

interface keyStore {
    keyPair: EphemeralKeyPair;
    setKeyPair: (newWeb5: EphemeralKeyPair) => void;
}

const useKeyPairStore = create<keyStore>((set) => ({
    keyPair: null,

    setKeyPair: (kp: EphemeralKeyPair) => {
        set(() => ({
            keyPair: kp,
        }));
    },
}));

export default useKeyPairStore;

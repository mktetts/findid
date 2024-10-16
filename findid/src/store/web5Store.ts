import FinDIDSDK from "@/sdk";
import { Web5 } from "@web5/api";
import { create } from "zustand";

interface Web5Store {
    web5: Web5;
    setWeb5: (newWeb5: Web5) => void;
    getWeb5: () => Promise<Web5>;
    clearWeb5: () => void;
}

const useWeb5InstanceStore = create<Web5Store>((set) => ({
    web5: null,

    setWeb5: (newWeb5: Web5) => {
        set(() => ({
            web5: newWeb5,
        }));
    },
    getWeb5: async () => {
        const { web5 } = useWeb5InstanceStore.getState(); 
        if (web5 === null) {
            const newWeb5 = FinDIDSDK.initWeb5();
            useWeb5InstanceStore.getState().setWeb5(newWeb5); 
            return newWeb5;
        }
        return web5;
    },

    clearWeb5: () => {
        set(() => ({
            web5: null,
        }));
    },
}));

export default useWeb5InstanceStore;

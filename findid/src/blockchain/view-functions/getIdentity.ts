import { MODULE_ADDRESS } from "@/constants";
import { aptosClient } from "../utils/aptosClient";

export const getIdentity = async (accountAddress) => {
    try {
      const res = await aptosClient().view({
        payload: {
          function: `${MODULE_ADDRESS}::identity_registration::get_identity`,
          functionArguments: [accountAddress],
        },
      });
  
      return res[0];
    } catch (error: any) {
      throw new Error(error.message)
    }
  };
  
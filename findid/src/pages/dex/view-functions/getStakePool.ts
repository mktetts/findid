import { DEX_MODULE_ADDRESS } from '@/constants';
import { aptosClient } from '../utils/aptosClient';

export const getStakePool = async () => {
    try {
        const rewards = await aptosClient().view({
            payload: {
                function: `${DEX_MODULE_ADDRESS}::dex::get_stake_pool`
            }
        });

        return rewards[0];
    } catch (error: any) {
        return 0;
    }
};

export const getRewardPool = async () => {
    try {
        const rewards = await aptosClient().view({
            payload: {
                function: `${DEX_MODULE_ADDRESS}::dex::get_reward_pool`
            }
        });

        return rewards[0];
    } catch (error: any) {
        return 0;
    }
};

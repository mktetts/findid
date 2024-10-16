import { Account, Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';
import { aptosClient } from '../utils/aptosClient';
import { coinImages } from '@/helpers/coinImages';

export const getAccountCoinsData = async (accountAddress: string) => {
    const coinsDetails = await aptosClient().getAccountCoinsData({
        accountAddress
    });
    const allCoins = [];
    for (let i = 0; i < coinsDetails.length; i++) {
        let coin = {
            asset_type: coinsDetails[i].asset_type,
            amount: coinsDetails[i].amount / Math.pow(10, coinsDetails[i].metadata.decimals),
            name: coinsDetails[i].metadata.name,
            symbol: coinsDetails[i].metadata.symbol,
            decimal: coinsDetails[i].metadata.decimals,
            image: coinsDetails[i].metadata.icon_uri || coinImages[coinsDetails[i].metadata.symbol]
        };
        allCoins.push(coin);
    }
    return allCoins;
};

export const getAccountRawCoinsData = async (accountAddress: string) => {
    const coinsDetails = await aptosClient().getAccountCoinsData({
        accountAddress
    });
    return coinsDetails
};


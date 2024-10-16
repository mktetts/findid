import { Account, Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';
import { aptosClient } from '../utils/aptosClient';
import { coinImages } from '@/helpers/coinImages';

export const getAccountTransactions= async (accountAddress: string) => {
    const transactions = await aptosClient().getAccountTransactions({
        accountAddress
    });
    return transactions
};


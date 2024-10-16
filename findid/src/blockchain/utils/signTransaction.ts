import { AccountAddress, Aptos, AptosConfig } from '@aptos-labs/ts-sdk';
import { aptosClient } from './aptosClient';
import { DEX_MODULE_ADDRESS, MODULE_ADDRESS, NETWORK } from '@/constants';
import FinDIDSDK from '@/sdk';
import { KeyManager } from './keyManagement';

const aptos = new Aptos(new AptosConfig({ network: NETWORK }));

export const signTransactionForRegisteringIdentity = async (key, pin, accountAddress, did, virtualName) => {
    try {
        let account = await KeyManager.getPrivateKeyFromIdentity(key, pin);
        if (account.publicKey.toString() !== key.publicKey) {
            throw new Error('Account Mismatch: Wrong pin or Identity to derive the account');
        }
        const transaction = await aptos.transaction.build.simple({
            sender: account.accountAddress,
            withFeePayer: true,
            data: {
                function: `${AccountAddress.from(MODULE_ADDRESS)}::identity_registration::register_identity`,
                functionArguments: [accountAddress, did, virtualName, key.salt]
            }
        });
        const signedTransaction = aptos.transaction.sign({
            signer: account,
            transaction
        });
        return { publickey: account.publicKey, transaction: transaction, senderAuthenticator: signedTransaction };
    } catch (e) {
        throw new Error(e.message);
    }
};

export const excecuteAddLiquidityTransaction = async (key, pin, transactionData) => {
    try {
        let account = await KeyManager.getPrivateKeyFromIdentity(key, pin);
        if (account.publicKey.toString() !== key.publicKey) {
            throw new Error('Account Mismatch: Wrong pin or Identity to derive the account');
        }
        const transaction = await aptos.transaction.build.simple({
            sender: account.accountAddress,
            data: {
                function: `${AccountAddress.from(DEX_MODULE_ADDRESS)}::dex::staking_coins`,
                functionArguments: [transactionData.amount],
                typeArguments: transactionData.typeArguments
            }
        });
        const signedTransaction = aptos.transaction.sign({
            signer: account,
            transaction
        });

        const [userTransactionResponseSimulate] = await aptos.transaction.simulate.simple({
            signerPublicKey: account.publicKey,
            transaction
        });
        if (!userTransactionResponseSimulate.success) {
            throw new Error('Error');
        }
        const committedTransaction = await aptosClient().transaction.submit.simple({
            transaction,
            senderAuthenticator: signedTransaction
        });
        const executedTransaction = await aptosClient().waitForTransaction({ transactionHash: committedTransaction.hash });
        return executedTransaction;
    } catch (e) {
        throw new Error(e.message);
    }
};


export const excecuteSwapTransaction = async (key, pin, transactionData) => {
    try {
        let account = await KeyManager.getPrivateKeyFromIdentity(key, pin);
        if (account.publicKey.toString() !== key.publicKey) {
            throw new Error('Account Mismatch: Wrong pin or Identity to derive the account');
        }
        const transaction = await aptos.transaction.build.simple({
            sender: account.accountAddress,
            data: {
                function: `${AccountAddress.from(DEX_MODULE_ADDRESS)}::dex::swap`,
                functionArguments: [transactionData.amount, transactionData.price_update_data],
                typeArguments: transactionData.typeArguments
            }
        });
        const signedTransaction = aptos.transaction.sign({
            signer: account,
            transaction
        });

        const [userTransactionResponseSimulate] = await aptos.transaction.simulate.simple({
            signerPublicKey: account.publicKey,
            transaction
        });
        if (!userTransactionResponseSimulate.success) {
            throw new Error('Error');
        }
        const committedTransaction = await aptosClient().transaction.submit.simple({
            transaction,
            senderAuthenticator: signedTransaction
        });
        const executedTransaction = await aptosClient().waitForTransaction({ transactionHash: committedTransaction.hash });
        return executedTransaction;
    } catch (e) {
        throw new Error(e.message);
    }
};


export const excecuteWithdrawLiquidityTransaction = async (key, pin, transactionData) => {
    try {
        let account = await KeyManager.getPrivateKeyFromIdentity(key, pin);
        if (account.publicKey.toString() !== key.publicKey) {
            throw new Error('Account Mismatch: Wrong pin or Identity to derive the account');
        }
        const transaction = await aptos.transaction.build.simple({
            sender: account.accountAddress,
            data: {
                function: `${AccountAddress.from(DEX_MODULE_ADDRESS)}::dex::withdraw_staks`,
                functionArguments: [transactionData.amount],
                typeArguments: transactionData.typeArguments
            }
        });
        const signedTransaction = aptos.transaction.sign({
            signer: account,
            transaction
        });

        const [userTransactionResponseSimulate] = await aptos.transaction.simulate.simple({
            signerPublicKey: account.publicKey,
            transaction
        });
        if (!userTransactionResponseSimulate.success) {
            throw new Error('Error');
        }
        const committedTransaction = await aptosClient().transaction.submit.simple({
            transaction,
            senderAuthenticator: signedTransaction
        });
        const executedTransaction = await aptosClient().waitForTransaction({ transactionHash: committedTransaction.hash });
        return executedTransaction;
    } catch (e) {
        throw new Error(e.message);
    }
};

export const excecuteWithdrawRewardTransaction = async (key, pin, transactionData) => {
    try {
        let account = await KeyManager.getPrivateKeyFromIdentity(key, pin);
        if (account.publicKey.toString() !== key.publicKey) {
            throw new Error('Account Mismatch: Wrong pin or Identity to derive the account');
        }
        const transaction = await aptos.transaction.build.simple({
            sender: account.accountAddress,
            data: {
                function: `${AccountAddress.from(DEX_MODULE_ADDRESS)}::dex::withdraw_rewards`,
                functionArguments: [transactionData.amount],
                typeArguments: transactionData.typeArguments
            }
        });
        const signedTransaction = aptos.transaction.sign({
            signer: account,
            transaction
        });

        const [userTransactionResponseSimulate] = await aptos.transaction.simulate.simple({
            signerPublicKey: account.publicKey,
            transaction
        });
        if (!userTransactionResponseSimulate.success) {
            throw new Error('Error');
        }
        const committedTransaction = await aptosClient().transaction.submit.simple({
            transaction,
            senderAuthenticator: signedTransaction
        });
        const executedTransaction = await aptosClient().waitForTransaction({ transactionHash: committedTransaction.hash });
        return executedTransaction;
    } catch (e) {
        throw new Error(e.message);
    }
};

export const excecuteAssRewardAsLiquidityTransaction = async (key, pin, transactionData) => {
    try {
        let account = await KeyManager.getPrivateKeyFromIdentity(key, pin);
        if (account.publicKey.toString() !== key.publicKey) {
            throw new Error('Account Mismatch: Wrong pin or Identity to derive the account');
        }
        const transaction = await aptos.transaction.build.simple({
            sender: account.accountAddress,
            data: {
                function: `${AccountAddress.from(DEX_MODULE_ADDRESS)}::dex::stake_rewards`,
                functionArguments: [transactionData.amount],
                typeArguments: transactionData.typeArguments
            }
        });
        const signedTransaction = aptos.transaction.sign({
            signer: account,
            transaction
        });

        const [userTransactionResponseSimulate] = await aptos.transaction.simulate.simple({
            signerPublicKey: account.publicKey,
            transaction
        });
        if (!userTransactionResponseSimulate.success) {
            throw new Error('Error');
        }
        const committedTransaction = await aptosClient().transaction.submit.simple({
            transaction,
            senderAuthenticator: signedTransaction
        });
        const executedTransaction = await aptosClient().waitForTransaction({ transactionHash: committedTransaction.hash });
        return executedTransaction;
    } catch (e) {
        throw new Error(e.message);
    }
};

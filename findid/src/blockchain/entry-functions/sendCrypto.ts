import { Aptos, AptosConfig } from '@aptos-labs/ts-sdk';
import { KeyManager } from '../utils/keyManagement';
import { NETWORK } from '@/constants';
import { aptosClient } from '../utils/aptosClient';

const aptos = new Aptos(new AptosConfig({ network: NETWORK }));

export const excecuteSendCryptoTransaction = async (key, pin, transactionData) => {
    try {
        let account = await KeyManager.getPrivateKeyFromIdentity(key, pin);
        if (account.publicKey.toString() !== key.publicKey) {
            throw new Error('Account Mismatch: Wrong pin or Identity to derive the account');
        }
        const transaction = await aptos.transaction.build.simple({
            sender: account.accountAddress,
            data: {
                function: '0x1::aptos_account::transfer_coins',
                typeArguments: [transactionData.typeArguments],
                functionArguments: [transactionData.to, transactionData.amount]
            }
        });

        const [userTransactionResponseSimulate] = await aptos.transaction.simulate.simple({
            signerPublicKey: account.publicKey,
            transaction
        });
        const signedTransaction = aptos.transaction.sign({
            signer: account,
            transaction
        });
        if (!userTransactionResponseSimulate.success) {
            throw new Error(userTransactionResponseSimulate.vm_status);
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

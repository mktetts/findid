import { Account, AccountAddress, Aptos, AptosConfig, Ed25519PrivateKey, SimpleTransaction } from '@aptos-labs/ts-sdk';
import { aptosClient } from '../utils/aptosClient';
import { MODULE_ADDRESS, SPONSER_TRANSACTION_ACCOUNT } from '@/constants';

export const registerIdentity = async (senderPublickey, senderAuthenticator, transaction: SimpleTransaction) => {
    try {
        let sponser: Account;
        const privateKeyBytes = Uint8Array.from(Buffer.from(SPONSER_TRANSACTION_ACCOUNT, 'hex'));
        const privateKey = new Ed25519PrivateKey(privateKeyBytes);
        sponser = await Account.fromPrivateKey({ privateKey });
      
        const sponserAuthenticator = await aptosClient().transaction.signAsFeePayer({
            signer: sponser,
            transaction
        });

        const [userTransactionResponseSimulate] = await aptosClient().transaction.simulate.simple({
            signerPublicKey: senderPublickey,
            feePayerPublicKey: sponser.publicKey,
            transaction
        });
        if (!userTransactionResponseSimulate.success) throw Error('Unknown Error');

        const committedTransaction = await aptosClient().transaction.submit.simple({
            transaction,
            senderAuthenticator: senderAuthenticator,
            feePayerAuthenticator: sponserAuthenticator
        });

        const executedTransaction = await aptosClient().waitForTransaction({ transactionHash: committedTransaction.hash });
        return executedTransaction;
    } catch (e) {
        throw new Error(e.message);
    }
};

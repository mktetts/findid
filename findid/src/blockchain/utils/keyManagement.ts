import * as ed25519 from 'noble-ed25519';
import pbkdf2 from 'pbkdf2';
import sha3 from 'crypto-js/sha3';
import SHA256 from 'crypto-js/sha256';
import { Account, Ed25519PrivateKey, PublicKey } from '@aptos-labs/ts-sdk';
import FinDIDSDK from '@/sdk';

export class KeyManager {
    static iterations: number = 100000;
    static keyLen: number = 32;
    static generateSalt = (): string => {
        const salt = new Uint8Array(16);
        window.crypto.getRandomValues(salt);
        return Buffer.from(salt).toString('hex');
    };

    static derivePrivateKeyFromPassword = async (password: string) => {
        try {
            const feedbackMessages = [];

            const hasLowerCase = /[a-z]/.test(password);
            const hasUpperCase = /[A-Z]/.test(password);
            const hasNumbers = /\d/.test(password);
            const hasSymbols = /[@$!%*?&#]/.test(password);
            const isLongEnough = password.length >= 8;

            if (!hasLowerCase) feedbackMessages.push('Password must contain at least one lowercase letter.');
            if (!hasUpperCase) feedbackMessages.push('Password must contain at least one uppercase letter.');
            if (!hasNumbers) feedbackMessages.push('Password must contain at least one number.');
            if (!hasSymbols) feedbackMessages.push('Password must contain at least one special character (@, $, !, %).');
            if (!isLongEnough) feedbackMessages.push('Password must be at least 8 characters long.');

            if (feedbackMessages.length) throw new Error('Weak Password' + JSON.stringify(feedbackMessages));

            const salt = KeyManager.generateSalt() + Date.now() + '';

            const key = await KeyManager.getAccount(
                pbkdf2.pbkdf2Sync(password, salt, KeyManager.iterations, KeyManager.keyLen, 'sha256')
            );

            return { ...key, salt: salt, passwordType: 'custom' };
        } catch (e) {
            throw new Error(e.message);
        }
    };
    static derivePrivateKeyFromIdentity = async pin => {
        try {
            const password = SHA256((await FinDIDSDK.getIdentity()) + '').toString() + JSON.stringify(pin);
            const salt = KeyManager.generateSalt() + Date.now() + '';
            const key = await KeyManager.getAccount(
                pbkdf2.pbkdf2Sync(password, salt, KeyManager.iterations, KeyManager.keyLen, 'sha256')
            );
            return { ...key, salt: salt };
        } catch (e) {
            throw new Error(e.message);
        }
    };

    static retrivePrivateKeyFromIdentity = async (salt, pin) => {
        try {
            const password = SHA256((await FinDIDSDK.getIdentity()) + '').toString() + JSON.stringify(pin);
            const key = await KeyManager.getAccount(
                pbkdf2.pbkdf2Sync(password, salt, KeyManager.iterations, KeyManager.keyLen, 'sha256')
            );
            return { ...key, salt: salt };
        } catch (e) {
            throw new Error(e.message);
        }
    };
    static getPrivateKeyFromPassword = async (keys, password) => {
        try {
            const salt = keys.salt;
            const account = await KeyManager.getAccountForSigning(
                pbkdf2.pbkdf2Sync(password, salt, KeyManager.iterations, KeyManager.keyLen, 'sha256')
            );

            return account;
        } catch (e) {
            throw new Error(e.message);
        }
    };
    static getPrivateKeyFromIdentity = async (keys, pin) => {
        try {
            const password = SHA256((await FinDIDSDK.getIdentity()) + '').toString() + JSON.stringify(pin);
            const salt = keys.salt;
            const account = await KeyManager.getAccountForSigning(
                pbkdf2.pbkdf2Sync(password, salt, KeyManager.iterations, KeyManager.keyLen, 'sha256')
            );
            return account;
        } catch (e) {
            throw new Error(e.message);
        }
    };
    static retrievePrivateKey = async (keys, pin) => {
        try {
            const salt = keys.salt;
            const password = SHA256((await FinDIDSDK.getIdentity()) + '').toString() + JSON.stringify(pin);
            const pk = pbkdf2.pbkdf2Sync(password, salt, KeyManager.iterations, KeyManager.keyLen, 'sha256');
            const account = await KeyManager.getAccountForSigning(pk)
            if(account.publicKey.toString() !== keys.publicKey)
                throw new Error("Wrong Pin. Account Mismatched")
            return Array.from(pk)
                .map(byte => (byte as any).toString(16).padStart(2, '0'))
                .join('');
        } catch (e) {
            throw new Error(e.message);
        }
    };
    static checkCorrectPinForAccount = async (keys, pin) => {
        try {
            const salt = keys.salt;
            const password = SHA256((await FinDIDSDK.getIdentity()) + '').toString() + JSON.stringify(pin);
            const pk = pbkdf2.pbkdf2Sync(password, salt, KeyManager.iterations, KeyManager.keyLen, 'sha256');
            const account = await KeyManager.getAccountForSigning(pk)
            if(account.publicKey.toString() !== keys.publicKey)
                throw new Error("Wrong Pin. Account Mismatched")
        } catch (e) {
            throw new Error(e.message);
        }
    };
    static getAccountForSigning = async (privateKey: Buffer) => {
        return Account.fromPrivateKey({ privateKey: new Ed25519PrivateKey(privateKey) });
    };
    static getAccount = async (privateKey: Buffer) => {
        const account = Account.fromPrivateKey({ privateKey: new Ed25519PrivateKey(privateKey) });
        const accountAddress = Array.from(account.accountAddress.data)
            .map(byte => byte.toString(16).padStart(2, '0'))
            .join('');
        return { address: accountAddress, publicKey: account.publicKey.toString() };
    };
}

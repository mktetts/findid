require("dotenv").config();
const fs = require("node:fs");
const yaml = require("js-yaml");
const cli = require("@aptos-labs/ts-sdk/dist/common/cli/index.js");
const aptosSDK = require("@aptos-labs/ts-sdk");


const config = yaml.load(fs.readFileSync("../identity/.aptos/config.yaml", "utf8"));
const accountAddress = config["profiles"]["default"]["account"];

const aptosConfig = new aptosSDK.AptosConfig({
    network: process.env.APP_NETWORK,
});
const aptos = new aptosSDK.Aptos(aptosConfig);
const move = new cli.Move();

move.createObjectAndPublishPackage({
    packageDirectoryPath: "../identity",
    addressName: "identity_contract",
    namedAddresses: {
        identity_contract: accountAddress,
    },
    profile: "default",
}).then((response) => {
    const filePath = "../../findid/.env";
    let envContent = "";
    // Check .env file exists and read it
    if (fs.existsSync(filePath)) {
        envContent = fs.readFileSync(filePath, "utf8");
    }

    // Regular expression to match the VITE_MODULE_ADDRESS variable
    const regex = /^VITE_IDENTITY_REGISTRATION_MODULE_ADDRESS=.*$/m;
    const newEntry = `VITE_IDENTITY_REGISTRATION_MODULE_ADDRESS=${response.objectAddress}`;

    // Check if VITE_MODULE_ADDRESS is already defined
    if (envContent.match(regex)) {
        // If the variable exists, replace it with the new value
        envContent = envContent.replace(regex, newEntry);
    } else {
        // If the variable does not exist, append it
        envContent += `\n${newEntry}`;
    }

    // Write the updated content back to the .env file
    fs.writeFileSync(filePath, envContent, "utf8");
});





// import { initWeb5 } from './web5/initWeb5';
// import { createCredential } from './web5/createCredential';

// export { initWeb5, createCredential };

// const { ethers } = require('ethers');
// const EC = require('elliptic').ec;

// // Your JWK private key
// const jwkPrivateKey = {
//     crv: 'secp256k1',
//     d: 'Ozvgk_C9J8r8hlGSILCneV7lYfi9rFKvmDSgFc8jKOQ', // Base64-encoded private key
//     x: 'r2DRdF92z-pYA-G8hcKE0dano6aSHHPnc_1ZCpLWiXQ', // Base64-encoded public key (x-coordinate)
//     y: '9KM55MbW2UsHQw3iD2WtnbaNNCU8FZRHrVxtlBmIbWw', // Base64-encoded public key (y-coordinate)
//     kty: 'EC',
//     alg: 'ES256K',
//     kid: 'j1HC7a-xpCcni5WEX00EMirmFGxwxxo87s4JUWyKllQ'
// };

// // Convert Base64 private key to hex format
// function base64ToHex(base64String) {
//     return Buffer.from(base64String, 'base64').toString('hex');
// }

// // Convert JWK private key to hex
// const privateKeyHex = base64ToHex(jwkPrivateKey.x);

// // Create an instance of the elliptic curve secp256k1
// const ec = new EC('secp256k1');

// // Generate key pair from private key
// const keyPair = ec.keyFromPrivate(privateKeyHex);
// console.log(privateKeyHex)


// const { ethers } = require('ethers');
// const { HDNode } = require('@ethersproject/hdnode');

// // Generate a random mnemonic (or use an existing one)
// const mnemonic = ethers.Wallet.createRandom().mnemonic.phrase; // Replace with your own mnemonic if you have one
// console.log('Mnemonic:', mnemonic);

// // Create an HD Node from the mnemonic
// const hdNode = HDNode.fromMnemonic("memory girl mind rent one soap tank account make federal tumble dish");

// // Generate multiple wallets
// for (let i = 0; i < 5; i++) {
//     const derivedNode = hdNode.derivePath(`m/44'/60'/0'/0/${i}`); // BIP-44 path for Ethereum
//     console.log(`Address ${i}:`, derivedNode.address);
//     console.log(`Private Key ${i}:`, derivedNode.privateKey);
// }
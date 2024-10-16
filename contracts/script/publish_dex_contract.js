require("dotenv").config();
const fs = require("node:fs");
const yaml = require("js-yaml");
const cli = require("@aptos-labs/ts-sdk/dist/common/cli/index.js");
const aptosSDK = require("@aptos-labs/ts-sdk");

const config = yaml.load(fs.readFileSync("../dex/.aptos/config.yaml", "utf8"));
const accountAddress = config["profiles"]["default"]["account"];

const aptosConfig = new aptosSDK.AptosConfig({
    network: process.env.APP_NETWORK,
});
const aptos = new aptosSDK.Aptos(aptosConfig);
const move = new cli.Move();

move.createObjectAndPublishPackage({
    packageDirectoryPath: "../dex",
    addressName: "dex_contract",
    namedAddresses: {
        dex_contract: accountAddress,
        pyth: "0x7e783b349d3e89cf5931af376ebeadbfab855b3fa239b7ada8f5a92fbea6b387",
        deployer:
            "0xb31e712b26fd295357355f6845e77c888298636609e93bc9b05f0f604049f434",
        wormhole:
            "0x5bc11445584a763c1fa7ed39081f1b920954da14e04b32440cba863d03e19625",
    },
    profile: "default",
}).then((response) => {
    console.log(response)
    const filePath = "../../findid/.env";
    let envContent = "";
    // Check .env file exists and read it
    if (fs.existsSync(filePath)) {
        envContent = fs.readFileSync(filePath, "utf8");
    }

    // Regular expression to match the VITE_MODULE_ADDRESS variable
    const regex = /^VITE_DEX_MODULE_ADDRESS=.*$/m;
    const newEntry = `VITE_DEX_MODULE_ADDRESS=${response.objectAddress}`;

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

// 0xe24a5b62d5dadabc279e9b70cf7674ed165ca12bd5c0eb79e99fb47ee8fcedc8
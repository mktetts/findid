export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
export const MODULE_ADDRESS = import.meta.env.VITE_IDENTITY_REGISTRATION_MODULE_ADDRESS;
export const NETWORK = import.meta.env.VITE_APP_NETWORK ?? 'testnet';
export const REDIRECT_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
export const SPONSER_TRANSACTION_ACCOUNT = import.meta.env.VITE_SPONSER_TRANSACTION_ACCOUNT;

// dex contract
export const DEX_MODULE_ADDRESS = import.meta.env.VITE_DEX_MODULE_ADDRESS;

export const APT_PRICE_IDENTIFIER = '0x44a93dddd8effa54ea51076c4e851b6cbbfd938e82eb90197de38fe8876bb66e';
export const USDT_PRICE_IDENTIFIER = '0x1fc18861232290221461220bd4e2acd1dcdfbc89c84092c93c18bdc7756c1588';
export const USDC_PRICE_IDENTIFIER = '0x41f3625971ca2ed2263e78573fe5ce23e13d2558ed3f2e47ab0f84fb9e7ae722';
export const ETH_PRICE_IDENTIFIER = '0xca80ba6dc32e08d06f1aa886011eed1d77c77be9eb761cc10d72b7d0a2fd57a6';
export const DAI_PRICE_IDENTIFIER = '0x87a67534df591d2dd5ec577ab3c75668a8e3d35e92e27bf29d9e2e52df8de412';
export const BTC_PRICE_IDENTIFIER = '0xf9c0172ba10dfa4d19088d94f5bf61d3b54d5bd7483a322a982e1373ee8ea31b';

export const APT_TYPE = '0x1::aptos_coin::AptosCoin';
export const BTC_TYPE = '0x43417434fd869edee76cca2a4d2301e528a1551b1d719b75c350c3c97d15b8b9::coins::BTC';
export const USDT_TYPE = '0x43417434fd869edee76cca2a4d2301e528a1551b1d719b75c350c3c97d15b8b9::coins::USDT';
export const ETH_TYPE = '0xb4d7b2466d211c1f4629e8340bb1a9e75e7f8fb38cc145c54c5c9f9d5017a318::coins::ETH';
export const DAI_TYPE = '0xb4d7b2466d211c1f4629e8340bb1a9e75e7f8fb38cc145c54c5c9f9d5017a318::coins::DAI';
export const USDC_TYPE = '0xb4d7b2466d211c1f4629e8340bb1a9e75e7f8fb38cc145c54c5c9f9d5017a318::coins::USDC';

export const COINS_DECIMALS_AND_IDENTIFIER = {
    APT: {
        decimal: 8,
        price_identifier: '0x44a93dddd8effa54ea51076c4e851b6cbbfd938e82eb90197de38fe8876bb66e',
        asset_type: '0x1::aptos_coin::AptosCoin'
    },
    BTC: {
        decimal: 8,
        price_identifier: '0xf9c0172ba10dfa4d19088d94f5bf61d3b54d5bd7483a322a982e1373ee8ea31b',
        asset_type: '0x43417434fd869edee76cca2a4d2301e528a1551b1d719b75c350c3c97d15b8b9::coins::BTC'
    },
    ETH: {
        decimal: 8,
        price_identifier: '0xca80ba6dc32e08d06f1aa886011eed1d77c77be9eb761cc10d72b7d0a2fd57a6',
        asset_type: '0xb4d7b2466d211c1f4629e8340bb1a9e75e7f8fb38cc145c54c5c9f9d5017a318::coins::ETH'
    },
    USDT: {
        decimal: 6,
        price_identifier: '0x1fc18861232290221461220bd4e2acd1dcdfbc89c84092c93c18bdc7756c1588',
        asset_type: '0x43417434fd869edee76cca2a4d2301e528a1551b1d719b75c350c3c97d15b8b9::coins::USDT'
    },
    USDC: {
        decimal: 6,
        price_identifier: '0x41f3625971ca2ed2263e78573fe5ce23e13d2558ed3f2e47ab0f84fb9e7ae722',
        asset_type: '0xb4d7b2466d211c1f4629e8340bb1a9e75e7f8fb38cc145c54c5c9f9d5017a318::coins::USDC'
    },
    DAI: {
        decimal: 6,
        price_identifier: '0x87a67534df591d2dd5ec577ab3c75668a8e3d35e92e27bf29d9e2e52df8de412',
        asset_type: '0xb4d7b2466d211c1f4629e8340bb1a9e75e7f8fb38cc145c54c5c9f9d5017a318::coins::DAI'
    }
};

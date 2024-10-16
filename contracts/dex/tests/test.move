#[test_only]
module dex_contract::dex_testing {
    use std::signer;
    use std::string::{Self};
    use aptos_std::debug;
    use aptos_framework::timestamp;
    use aptos_framework::account;
    use aptos_framework::aptos_coin::{Self, AptosCoin};
    use aptos_framework::coin;
    use dex_contract::dex;

    use test_coins::coins::{USDT, BTC, register_coins, mint_coin};
    const TEST_VAAS: vector<vector<u8>> = vector[x"0100000000010036eb563b80a24f4253bee6150eb8924e4bdf6e4fa1dfc759a6664d2e865b4b134651a7b021b7f1ce3bd078070b688b6f2e37ce2de0d9b48e6a78684561e49d5201527e4f9b00000001001171f8dcb863d176e2c420ad6610cf687359612b6fb392e0642b0ca6b1f186aa3b0000000000000001005032574800030000000102000400951436e0be37536be96f0896366089506a59763d036728332d3e3038047851aea7c6c75c89f14810ec1c54c03ab8f1864a4c4032791f05747f560faec380a695d1000000000000049a0000000000000008fffffffb00000000000005dc0000000000000003000000000100000001000000006329c0eb000000006329c0e9000000006329c0e400000000000006150000000000000007215258d81468614f6b7e194c5d145609394f67b041e93e6695dcc616faadd0603b9551a68d01d954d6387aff4df1529027ffb2fee413082e509feb29cc4904fe000000000000041a0000000000000003fffffffb00000000000005cb0000000000000003010000000100000001000000006329c0eb000000006329c0e9000000006329c0e4000000000000048600000000000000078ac9cf3ab299af710d735163726fdae0db8465280502eb9f801f74b3c1bd190333832fad6e36eb05a8972fe5f219b27b5b2bb2230a79ce79beb4c5c5e7ecc76d00000000000003f20000000000000002fffffffb00000000000005e70000000000000003010000000100000001000000006329c0eb000000006329c0e9000000006329c0e40000000000000685000000000000000861db714e9ff987b6fedf00d01f9fea6db7c30632d6fc83b7bc9459d7192bc44a21a28b4c6619968bd8c20e95b0aaed7df2187fd310275347e0376a2cd7427db800000000000006cb0000000000000001fffffffb00000000000005e40000000000000003010000000100000001000000006329c0eb000000006329c0e9000000006329c0e400000000000007970000000000000001"];


    #[test(aptos_framework = @0x1, dex_admin = @dex_contract, user1 = @0x1, user2= @0x2, user3= @0x3, token_admin = @test_coins)]
    public fun test1(
        aptos_framework: &signer,
        dex_admin: &signer,
        user1: &signer,
        user2: &signer,
        user3: &signer,
        token_admin: &signer
    ) {
        let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(aptos_framework);
        account::create_account_for_test(signer::address_of(token_admin));
        register_coins(token_admin);

        let dex_admin_addr = signer::address_of(dex_admin);
        let user1_addr = signer::address_of(user1);
        let user2_addr = signer::address_of(user2);
        let user3_addr = signer::address_of(user3);
        timestamp::set_time_has_started_for_testing(aptos_framework);

        account::create_account_for_test(dex_admin_addr);
        account::create_account_for_test(user1_addr);
        account::create_account_for_test(user2_addr);
        account::create_account_for_test(user3_addr);

        coin::register<AptosCoin>(dex_admin);
        coin::register<USDT>(dex_admin);
        coin::register<BTC>(dex_admin);
        coin::register<AptosCoin>(user1);
        coin::register<USDT>(user1);
        coin::register<BTC>(user1);
        coin::register<AptosCoin>(user2);
        coin::register<USDT>(user2);
        coin::register<BTC>(user2);
        coin::register<AptosCoin>(user3);
        coin::register<USDT>(user3);
        coin::register<BTC>(user3);

        mint_coin<USDT>(token_admin, dex_admin_addr, 10000000); // decimal 6 - 10 USDT
        mint_coin<BTC>(token_admin, dex_admin_addr, 1000000000); // decimal 8 - 10 BTC
        mint_coin<USDT>(token_admin, user1_addr, 10000000);
        mint_coin<BTC>(token_admin, user1_addr, 100000000);
        mint_coin<USDT>(token_admin, user2_addr, 10000000);
        mint_coin<BTC>(token_admin, user2_addr, 100000000);
        mint_coin<USDT>(token_admin, user3_addr, 10000000);
        mint_coin<BTC>(token_admin, user3_addr, 100000000);

        dex::init_module_for_test(dex_admin);

        dex::staking_coins<USDT>(user1, 5000000);
        dex::staking_coins<USDT>(user2, 4000000);

        aptos_coin::mint(aptos_framework, user3_addr, 1000000000);
        debug::print(&string::utf8(b"before swapping user 1 balance"));
        debug::print(&dex::check_balance<AptosCoin>(user1_addr));

        debug::print(&string::utf8(b"before swapping user 3 balance"));
        debug::print(&dex::check_balance<AptosCoin>(user3_addr));

        dex::swap<AptosCoin, USDT>(user3, 2000000, TEST_VAAS);

        debug::print(&string::utf8(b"after swapping user 3 balance"));
        debug::print(&dex::check_balance<AptosCoin>(user3_addr));

        debug::print(&string::utf8(b"After swapping user 1 balance"));
        debug::print(&dex::check_balance<AptosCoin>(user1_addr));

        debug::print(&string::utf8(b"After swapping user 3 USDT balance"));
        debug::print(&dex::check_balance<USDT>(user3_addr));

        // debug::print(&dex::get_dex_signer_address());
        // dex::withdraw_staks<USDT>(user1, 3000000);
        // dex::withdraw_rewards<AptosCoin>(user1, 12705723);
        // fungible_asset::transfer(user1, user1_address, fa);
        // debug::print(&dex::get_stake_pool());
        // dex::init_module_for_test(token_admin);
        // debug::print(&dex::check_balance(signer::address_of(token_admin)));

        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }
}

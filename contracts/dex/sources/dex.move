module dex_contract::dex {

    use std::signer;
    use std::string;
    use std::string::String;
    use std::vector;
    use aptos_std::math64;
    use aptos_std::simple_map::{Self, SimpleMap};
    use aptos_framework::aptos_account;
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::coin;
    use aptos_framework::event;
    use test_coins::coins::{USDT, BTC};
    use test_coins_extended::coins_extended::{ETH, USDC, DAI};
    use aptos_framework::object::{Self, ExtendRef};
    use pyth::i64;
    use pyth::price;

    use pyth::pyth;
    use pyth::price::Price;
    use pyth::price_identifier;

    const ENOT_ENOUGH_BALANCE: u64 = 1;
    const ENOT_HAVING_ENOUGH_REWARDS: u64 = 2;
    const ESTAKER_NOT_FOUND: u64 = 1;
    // 0.3% fee (100% = 1_000_000)
    const ENOT_ENOUGH_LIQUIDITY: u64 = 2;

    struct UserStakeController has key {
        extend_ref: ExtendRef,
    }
    #[event]
    struct StakingEvent has store, drop {
        address: address,
        token: String,
        amount: u64,
    }
    #[event]
    struct WithdrawEvent has store, drop {
        address: address,
        token: String,
        amount: u64,
    }
    #[event]
    struct StakeRewardEvent has store, drop {
        address: address,
        token: String,
        amount: u64,
    }
    #[event]
    struct SwapEvent has store, drop {
        address: address,
        to_token: String,
        from_token: String,
        amount: u64,
    }
    struct StakePoolDetails has key, store, copy, drop {
        token: String,
        price_feed_identifier: vector<u8>,
        total_amount: u64,
        stakers: SimpleMap<address, u64>
    }

    struct StakePool has key, store, copy, drop {
        stake_pool: SimpleMap<String, StakePoolDetails>
    }

    struct RewardPoolDetails has key, store, copy, drop {
        rewards: SimpleMap<address, u64>
    }

    struct RewardPool has key, store, copy, drop {
        reward_pool: SimpleMap<String, RewardPoolDetails>
    }

    const TEST_VAAS: vector<vector<u8>> = vector[x"0100000000010036eb563b80a24f4253bee6150eb8924e4bdf6e4fa1dfc759a6664d2e865b4b134651a7b021b7f1ce3bd078070b688b6f2e37ce2de0d9b48e6a78684561e49d5201527e4f9b00000001001171f8dcb863d176e2c420ad6610cf687359612b6fb392e0642b0ca6b1f186aa3b0000000000000001005032574800030000000102000400951436e0be37536be96f0896366089506a59763d036728332d3e3038047851aea7c6c75c89f14810ec1c54c03ab8f1864a4c4032791f05747f560faec380a695d1000000000000049a0000000000000008fffffffb00000000000005dc0000000000000003000000000100000001000000006329c0eb000000006329c0e9000000006329c0e400000000000006150000000000000007215258d81468614f6b7e194c5d145609394f67b041e93e6695dcc616faadd0603b9551a68d01d954d6387aff4df1529027ffb2fee413082e509feb29cc4904fe000000000000041a0000000000000003fffffffb00000000000005cb0000000000000003010000000100000001000000006329c0eb000000006329c0e9000000006329c0e4000000000000048600000000000000078ac9cf3ab299af710d735163726fdae0db8465280502eb9f801f74b3c1bd190333832fad6e36eb05a8972fe5f219b27b5b2bb2230a79ce79beb4c5c5e7ecc76d00000000000003f20000000000000002fffffffb00000000000005e70000000000000003010000000100000001000000006329c0eb000000006329c0e9000000006329c0e40000000000000685000000000000000861db714e9ff987b6fedf00d01f9fea6db7c30632d6fc83b7bc9459d7192bc44a21a28b4c6619968bd8c20e95b0aaed7df2187fd310275347e0376a2cd7427db800000000000006cb0000000000000001fffffffb00000000000005e40000000000000003010000000100000001000000006329c0eb000000006329c0e9000000006329c0e400000000000007970000000000000001"];


    fun init_module(sender: &signer) {
        let sender_addr = signer::address_of(sender);
        let user_stake_controller_constructor_ref = &object::create_object(sender_addr);
        move_to(sender, UserStakeController {
            extend_ref: object::generate_extend_ref(user_stake_controller_constructor_ref),
        });
        let signer = object::generate_signer_for_extending(
            &object::generate_extend_ref(user_stake_controller_constructor_ref)
        );
        aptos_account::create_account(signer::address_of(&signer));
        coin::register<USDT>(&signer);
        coin::register<BTC>(&signer);
        coin::register<USDC>(&signer);
        coin::register<ETH>(&signer);
        coin::register<DAI>(&signer);

        let stake_pool = StakePool {
            stake_pool: simple_map::new<String, StakePoolDetails>()
        };
        simple_map::add(&mut stake_pool.stake_pool, string::utf8(b"APT"), StakePoolDetails {
            token: string::utf8(b"APT"),
            price_feed_identifier: x"44a93dddd8effa54ea51076c4e851b6cbbfd938e82eb90197de38fe8876bb66e",
            total_amount: 0,
            stakers: simple_map::new<address, u64>()
        });
        simple_map::add(&mut stake_pool.stake_pool, string::utf8(b"USDT"), StakePoolDetails {
            token: string::utf8(b"USDT"),
            price_feed_identifier: x"1fc18861232290221461220bd4e2acd1dcdfbc89c84092c93c18bdc7756c1588",
            total_amount: 0,
            stakers: simple_map::new<address, u64>()
        });
        simple_map::add(&mut stake_pool.stake_pool, string::utf8(b"BTC"), StakePoolDetails {
            token: string::utf8(b"BTC"),
            price_feed_identifier: x"f9c0172ba10dfa4d19088d94f5bf61d3b54d5bd7483a322a982e1373ee8ea31b",
            total_amount: 0,
            stakers: simple_map::new<address, u64>()
        });
        simple_map::add(&mut stake_pool.stake_pool, string::utf8(b"ETH"), StakePoolDetails {
            token: string::utf8(b"ETH"),
            price_feed_identifier: x"ca80ba6dc32e08d06f1aa886011eed1d77c77be9eb761cc10d72b7d0a2fd57a6",
            total_amount: 0,
            stakers: simple_map::new<address, u64>()
        });
        simple_map::add(&mut stake_pool.stake_pool, string::utf8(b"DAI"), StakePoolDetails {
            token: string::utf8(b"DAI"),
            price_feed_identifier: x"87a67534df591d2dd5ec577ab3c75668a8e3d35e92e27bf29d9e2e52df8de412",
            total_amount: 0,
            stakers: simple_map::new<address, u64>()
        });
        simple_map::add(&mut stake_pool.stake_pool, string::utf8(b"USDC"), StakePoolDetails {
            token: string::utf8(b"USDC"),
            price_feed_identifier: x"41f3625971ca2ed2263e78573fe5ce23e13d2558ed3f2e47ab0f84fb9e7ae722",
            total_amount: 0,
            stakers: simple_map::new<address, u64>()
        });

        let reward_pool = RewardPool {
            reward_pool: simple_map::new<String, RewardPoolDetails>()
        };
        simple_map::add(&mut reward_pool.reward_pool, string::utf8(b"APT"), RewardPoolDetails {
            rewards: simple_map::new<address, u64>()
        });
        simple_map::add(&mut reward_pool.reward_pool, string::utf8(b"USDT"), RewardPoolDetails {
            rewards: simple_map::new<address, u64>()
        });
        simple_map::add(&mut reward_pool.reward_pool, string::utf8(b"BTC"), RewardPoolDetails {
            rewards: simple_map::new<address, u64>()
        });
        simple_map::add(&mut reward_pool.reward_pool, string::utf8(b"USDC"), RewardPoolDetails {
            rewards: simple_map::new<address, u64>()
        });
        simple_map::add(&mut reward_pool.reward_pool, string::utf8(b"ETH"), RewardPoolDetails {
            rewards: simple_map::new<address, u64>()
        });
        simple_map::add(&mut reward_pool.reward_pool, string::utf8(b"DAI"), RewardPoolDetails {
            rewards: simple_map::new<address, u64>()
        });
        move_to(sender, reward_pool);
        move_to(sender, stake_pool);
    }

    public entry fun staking_coins<CoinType>(staker: &signer, amount: u64) acquires StakePool, UserStakeController {
        let staker_addr = signer::address_of(staker);
        let coin_symbol = coin::symbol<CoinType>();
        let balance = coin::balance<CoinType>(staker_addr);
        assert!(balance >= amount, ENOT_ENOUGH_BALANCE);
        let coins = coin::withdraw<CoinType>(staker, amount);
        let user_stake_object_signer = generate_user_stake_object_signer();
        let gstake_pool = borrow_global_mut<StakePool>(@dex_contract);
        let stake_pool = simple_map::borrow_mut(&mut gstake_pool.stake_pool, &coin_symbol);
        if (!simple_map::contains_key(&stake_pool.stakers, &staker_addr)) {
            simple_map::add(&mut stake_pool.stakers, staker_addr, 0);
        };
        let current_stake = simple_map::borrow_mut(&mut stake_pool.stakers, &staker_addr);
        *current_stake = *current_stake + amount;
        stake_pool.total_amount = stake_pool.total_amount + amount;
        coin::deposit(signer::address_of(&user_stake_object_signer), coins);

        event::emit(StakingEvent {
            address: staker_addr,
            token: coin_symbol,
            amount
        })
    }


    const FEE_PERCENTAGE: u64 = 3; // 0.3%
    const SCALING_FACTOR: u64 = 1_000_000;

    public entry fun swap<CoinTypeFrom, CoinTypeTo>(
        swapper: &signer,
        swap_amount: u64,
        pyth_update_data: vector<vector<u8>>
    ) acquires StakePool, RewardPool, UserStakeController
    {
        let swapper_addr = signer::address_of(swapper);
        update_price_fee(swapper, pyth_update_data);

        let gstake_pool = borrow_global_mut<StakePool>(@dex_contract);
        let greward_pool = borrow_global_mut<RewardPool>(@dex_contract);
        let coin_symbol_to = coin::symbol<CoinTypeTo>();
        let coin_symbol_from = coin::symbol<CoinTypeFrom>();
        let from_coin_reward_pool = simple_map::borrow_mut(&mut greward_pool.reward_pool, &coin_symbol_from);
        let to_coin_stake_pool = simple_map::borrow_mut(&mut gstake_pool.stake_pool, &coin_symbol_to);

        // let from_coin_price = price::new(i64::new(900525000, false), 674, i64::new(8, false), 1663680700);
        // let to_coin_price = price::new(i64::new(99977511, false), 674, i64::new(8, true), 1663680700);

        let from_coin_price = get_coin_price(to_coin_stake_pool.price_feed_identifier);
        let to_coin_price = get_coin_price(to_coin_stake_pool.price_feed_identifier);

        let from_coin_price_magnitude = i64::get_magnitude_if_positive(&price::get_price(&from_coin_price));
        let to_coin_price_magnitude = i64::get_magnitude_if_positive(&price::get_price(&to_coin_price));
        let from_coin_required = math64::mul_div(to_coin_price_magnitude, swap_amount, from_coin_price_magnitude);
        let from_coin_decimal: u64 = (coin::decimals<CoinTypeFrom>() as u64);
        let to_coin_decimal: u64 = (coin::decimals<CoinTypeTo>() as u64);
        from_coin_required = math64::mul_div(
            from_coin_required,
            math64::pow(10, from_coin_decimal),
            math64::pow(10, to_coin_decimal)
        );
        let fee = ((from_coin_required * FEE_PERCENTAGE) / 100);
        let total_from_coin_required = from_coin_required + fee;

        assert!(coin::balance<CoinTypeFrom>(swapper_addr) >= total_from_coin_required, ENOT_ENOUGH_BALANCE);
        let from_coins = coin::withdraw<CoinTypeFrom>(swapper, total_from_coin_required);
        let user_stake_object_signer = generate_user_stake_object_signer();
        coin::deposit(signer::address_of(&user_stake_object_signer), from_coins);

        assert!(to_coin_stake_pool.total_amount > swap_amount, ENOT_ENOUGH_LIQUIDITY);
        let to_coins_to_swapper = coin::withdraw<CoinTypeTo>(&user_stake_object_signer, swap_amount);
        coin::deposit(signer::address_of(swapper), to_coins_to_swapper);
        let stakers = to_coin_stake_pool.stakers;
        let staker_addresses = simple_map::keys(&stakers);
        let num_stakers = vector::length(&staker_addresses);
        let i = 0;
        while (i < num_stakers) {
            let staker_addr = vector::borrow(&staker_addresses, i);
            let staker_amount = simple_map::borrow_mut(&mut stakers, staker_addr);
            let contributed_percentage = (*staker_amount * SCALING_FACTOR) / to_coin_stake_pool.total_amount;
            let staker_share = (total_from_coin_required * contributed_percentage) / SCALING_FACTOR;
            if (staker_share > 0) {
                if (!simple_map::contains_key(&from_coin_reward_pool.rewards, staker_addr)) {
                    simple_map::add(&mut from_coin_reward_pool.rewards, *staker_addr, 0);
                };
                let current_reward = simple_map::borrow_mut(&mut from_coin_reward_pool.rewards, staker_addr);
                *current_reward = *current_reward + staker_share;
                let staker_amount = simple_map::borrow_mut(&mut to_coin_stake_pool.stakers, staker_addr);
                *staker_amount = *staker_amount - math64::mul_div(contributed_percentage, swap_amount, (math64::pow(
                    10,
                    to_coin_decimal
                )));
            };

            i = i + 1;
        };
        to_coin_stake_pool.total_amount = to_coin_stake_pool.total_amount - swap_amount;

        event::emit(SwapEvent {
            address: swapper_addr,
            to_token: coin_symbol_to,
            from_token: coin_symbol_from,
            amount: swap_amount
        })
    }

    public entry fun withdraw_staks<CoinType>(staker: &signer, amount: u64) acquires UserStakeController, StakePool {
        let staker_addr = signer::address_of(staker);
        let coin_symbol = coin::symbol<CoinType>();
        let user_stake_object_signer = generate_user_stake_object_signer();
        let gstake_pool = borrow_global_mut<StakePool>(@dex_contract);
        let stake_pool = simple_map::borrow_mut(&mut gstake_pool.stake_pool, &coin_symbol);
        assert! (simple_map::contains_key(&stake_pool.stakers, &staker_addr), ESTAKER_NOT_FOUND);
        let current_stake = simple_map::borrow_mut(&mut stake_pool.stakers, &staker_addr);
        assert!(*current_stake >= amount, ENOT_ENOUGH_BALANCE);
        *current_stake = *current_stake - amount;
        stake_pool.total_amount = stake_pool.total_amount - amount;
        let coins = coin::withdraw<CoinType>(&user_stake_object_signer, amount);
        coin::deposit(staker_addr, coins);
    }
    public entry fun withdraw_rewards<CoinType>(sender: &signer, amount: u64) acquires UserStakeController, RewardPool {
        let sender_address = signer::address_of(sender);
        let greward_pool = borrow_global_mut<RewardPool>(@dex_contract);
        let coin_symbol = coin::symbol<CoinType>();
        let coin_reward_pool = simple_map::borrow_mut(&mut greward_pool.reward_pool, &coin_symbol);
        assert!(simple_map::contains_key(&coin_reward_pool.rewards, &sender_address), ENOT_HAVING_ENOUGH_REWARDS);
        let current_reward = simple_map::borrow_mut(&mut coin_reward_pool.rewards, &sender_address);
        assert!(*current_reward >= amount, ENOT_ENOUGH_BALANCE);

        let user_stake_object_signer = generate_user_stake_object_signer();
        let coins = coin::withdraw<CoinType>(&user_stake_object_signer, amount);
        coin::deposit(sender_address, coins);
        *current_reward = *current_reward - amount;

        event::emit(WithdrawEvent {
            address: sender_address,
            token: coin_symbol,
            amount
        })
    }

    public entry fun stake_rewards<CoinType>(
        sender: &signer,
        amount: u64
    ) acquires UserStakeController, RewardPool, StakePool {
        let sender_address = signer::address_of(sender);
        let greward_pool = borrow_global_mut<RewardPool>(@dex_contract);
        let coin_symbol = coin::symbol<CoinType>();
        let coin_reward_pool = simple_map::borrow_mut(&mut greward_pool.reward_pool, &coin_symbol);
        assert!(simple_map::contains_key(&coin_reward_pool.rewards, &sender_address), ENOT_HAVING_ENOUGH_REWARDS);
        let current_reward = simple_map::borrow_mut(&mut coin_reward_pool.rewards, &sender_address);
        assert!(*current_reward >= amount, ENOT_ENOUGH_BALANCE);

        let user_stake_object_signer = generate_user_stake_object_signer();
        let coins = coin::withdraw<CoinType>(&user_stake_object_signer, amount);

        let gstake_pool = borrow_global_mut<StakePool>(@dex_contract);
        let stake_pool = simple_map::borrow_mut(&mut gstake_pool.stake_pool, &coin_symbol);
        if (!simple_map::contains_key(&stake_pool.stakers, &sender_address)) {
            simple_map::add(&mut stake_pool.stakers, sender_address, 0);
        };
        let current_stake = simple_map::borrow_mut(&mut stake_pool.stakers, &sender_address);
        *current_stake = *current_stake + amount;
        stake_pool.total_amount = stake_pool.total_amount + amount;
        coin::deposit(signer::address_of(&user_stake_object_signer), coins);

        event::emit(StakeRewardEvent {
            address: sender_address,
            token: coin_symbol,
            amount
        })
    }


    fun generate_user_stake_object_signer(): signer acquires UserStakeController {
        object::generate_signer_for_extending(&borrow_global<UserStakeController>(@dex_contract).extend_ref)
    }
    #[view]
    public fun get_dex_signer_address(): address acquires UserStakeController {
        signer::address_of(&object::generate_signer_for_extending(&borrow_global<UserStakeController>(@dex_contract).extend_ref))
    }

    #[view]
    public fun get_stake_pool(): StakePool acquires StakePool {
        let gstake_pool = borrow_global<StakePool>(@dex_contract);
        *gstake_pool
    }
    #[view]
    public fun get_reward_pool(): RewardPool acquires RewardPool {
        let greward_pool = borrow_global<RewardPool>(@dex_contract);
        *greward_pool
    }

    #[view]
    public fun check_balance<CoinType>(user_address: address): u64 {
        coin::balance<CoinType>(user_address)
    }

    fun update_price_fee(user: &signer, pyth_update_data: vector<vector<u8>>) {
        let coins = coin::withdraw<AptosCoin>(user, pyth::get_update_fee(&pyth_update_data));
        pyth::update_price_feeds(pyth_update_data, coins);
    }

    // public fun update_price_feeds(user: &signer, pyth_update_data: vector<vector<u8>>) {
    //     let coins = coin::withdraw<AptosCoin>(user, pyth::get_update_fee(&pyth_update_data));
    //     pyth::update_price_feeds(pyth_update_data, coins);
    // }
    //
    // public fun update_price_feeds1(user: &signer, pyth_update_data: vector<vector<u8>>): Price {
    //     let coins = coin::withdraw<AptosCoin>(user, pyth::get_update_fee(&pyth_update_data));
    //     pyth::update_price_feeds(pyth_update_data, coins);
    //     pyth::get_price(
    //         price_identifier::from_byte_vec(x"03ae4db29ed4ae33d323568895aa00337e658e348b37509f5372ae51f0af00d5")
    //     )
    // }
    //
    // public entry fun update_price_feed(user: &signer, pyth_update_data: vector<vector<u8>>) {
    //     let coins = coin::withdraw<AptosCoin>(user, pyth::get_update_fee(&pyth_update_data));
    //     pyth::update_price_feeds(pyth_update_data, coins);
    // }

    public fun get_coin_price(price_identifier: vector<u8>): Price {
        let btc_usd_price_id = price_identifier::from_byte_vec(price_identifier);
        pyth::get_price(btc_usd_price_id)
    }


    #[test_only]
    public fun init_module_for_test(sender: &signer) {
        init_module(sender);
    }
}
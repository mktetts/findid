#[test_only]
module identity_contract::identity_registration_test {
    use identity_contract::identity_registration;
    use std::signer;
    use std::string::{Self};
    // use aptos_std::debug;
    use aptos_framework::timestamp;
    use aptos_framework::account;
    use aptos_framework::aptos_coin::{Self, AptosCoin};
    use aptos_framework::coin;

    #[test(aptos_framework = @0x1, sender = @identity_contract, user1 = @0x200)]
    public fun testing_identity_contract(
        aptos_framework: &signer,
        sender: &signer,
        user1: &signer) {
        let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(aptos_framework);

        let user1_addr = signer::address_of(user1);
        timestamp::set_time_has_started_for_testing(aptos_framework);
        account::create_account_for_test(user1_addr);
        coin::register<AptosCoin>(user1);
        identity_registration::init_module_for_test(sender);

        identity_registration::register_identity(
            user1,
            string::utf8(b"account"),
            string::utf8(b"did"),
            string::utf8(b"virutal_name"),
            string::utf8(b"salt")
        );

        let _identity = identity_registration::get_identity(string::utf8(b"account"));

        identity_registration::update_identity(user1,
            string::utf8(b"account"),
            string::utf8(b"diddid"),
            string::utf8(b"virutal_name"), string::utf8(b"salt"));

        // let identity = identity_registration::get_identity(string::utf8(b"account"));
        // debug::print(&identity);
        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }
}
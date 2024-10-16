module identity_contract::identity_registration {
    use std::signer;
    use std::string::{Self, String};
    // use aptos_std::debug;
    use aptos_framework::event;
    use aptos_std::simple_map::{Self, SimpleMap};

    const EACCOUNT_ALREADY_ADDED_TO_IDENTITY: u64 = 1;
    const EIDENTITY_NOT_FOUND: u64 = 2;
    const EACCOUNT_NOT_FOUND_TO_UPDATE: u64 = 3;
    const EACCOUNT_OWNER_CAN_UPDATE: u64 = 3;

    #[event]
    struct IdentityCreationEvent has store, drop {
        address: address,
        did: String,
        account: String,
        virtual_name: String
    }
    #[event]
    struct IdentityUpdateEvent has store, drop {
        address: address,
        did: String,
        account: String,
        virtual_name: String
    }

    struct IdentityDetails has store, drop, copy {
        owner: address,
        did: String,
        account: String,
        virtual_name: String,
        salt: String
    }

    struct Identity has key, store, drop, copy {
        identities: SimpleMap<String, IdentityDetails>
    }

    fun init_module(sender: &signer) {
        move_to(sender, Identity {
            identities: simple_map::new<String, IdentityDetails>()
        })
    }


    public entry fun register_identity(
        sender: &signer,
        account: String,
        did: String,
        virtual_name: String,
        salt: String
    ) acquires Identity {
        let sender_address = signer::address_of(sender);
        let identity = borrow_global_mut<Identity>(@identity_contract);
        assert!(!simple_map::contains_key(&identity.identities, &account), EACCOUNT_ALREADY_ADDED_TO_IDENTITY);
        simple_map::add(&mut identity.identities, account, IdentityDetails {
            owner: sender_address,
            did,
            account,
            virtual_name,
            salt
        });
        event::emit(IdentityCreationEvent {
            address: sender_address,
            did,
            account,
            virtual_name
        })
    }

    public entry fun update_identity(
        sender: &signer,
        account: String,
        did: String,
        virtual_name: String,
        salt: String
    )acquires Identity {
        let sender_address = signer::address_of(sender);
        let identity = borrow_global_mut<Identity>(@identity_contract);
        assert!(simple_map::contains_key(&identity.identities, &account), EACCOUNT_NOT_FOUND_TO_UPDATE);
        let identity_details = simple_map::borrow_mut(&mut identity.identities, &account);
        assert!(identity_details.owner == sender_address, EACCOUNT_OWNER_CAN_UPDATE);
       *identity_details = IdentityDetails{
           owner: sender_address,
           did,
           account,
           virtual_name,
           salt
       };
        event::emit(IdentityUpdateEvent {
            address: sender_address,
            did,
            account,
            virtual_name
        })
    }

    #[view]
    public fun get_identity(account: String): IdentityDetails acquires Identity {
        let identity = borrow_global_mut<Identity>(@identity_contract);
        if(!simple_map::contains_key(&identity.identities, &account)){
            return IdentityDetails{
                account: string::utf8(b""),
                did: string::utf8(b""),
                virtual_name: string::utf8(b""),
                owner: @0,
                salt: string::utf8(b"")
            }
        };
        let identity = borrow_global<Identity>(@identity_contract);
        let identity_details = simple_map::borrow(&identity.identities, &account);
        *identity_details
        // if(identity_details.owner == sender){
        // }
        // else{
        //     IdentityDetails{
        //         account: string::utf8(b""),
        //         did: string::utf8(b""),
        //         virtual_name: string::utf8(b""),
        //         owner: @0
        //     }
        // }
    }

    #[test_only]
    public fun init_module_for_test(sender: &signer) {
        init_module(sender);
    }
}
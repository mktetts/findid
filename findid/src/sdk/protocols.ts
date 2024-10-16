export const myIdentity = {
    protocol: 'https://findid.org/protocol/myIdentity', // dummy
    published: true,
    types: {
        myIdentity: {
            schema: 'https://schema.org/myIdentity', // dummy
            dataFormats: ['application/json']
        }
    },
    structure: {
        myIdentity: {
            $actions: [
                {
                    who: 'author',
                    of: 'myIdentity',
                    can: ['delete', 'create', 'read', 'update']
                }
            ]
        }
    }
};

export const addCryptoCardProtocol = {
    protocol: 'https://findid.org/protocol/addCryptoCard', 
    published: true,
    types: {
        card: {
            schema: 'https://schema.org/addCryptoCard', 
            dataFormats: ['application/jwt']
        }
    },
    structure: {
        card: {
            $actions: [
                {
                    who: 'author',
                    of: 'card',
                    can: ['delete', 'create', 'read', 'update']
                }
            ]
        }
    }
};
export const addContactProtocol = {
    protocol: 'https://findid.org/protocol/addContact', 
    published: true,
    types: {
        card: {
            schema: 'https://schema.org/addContact', 
            dataFormats: ['application/jwt']
        }
    },
    structure: {
        card: {
            $actions: [
                {
                    who: 'author',
                    of: 'card',
                    can: ['delete', 'create', 'read', 'update']
                }
            ]
        }
    }
};

export const sentCryptoProtocol = {
    protocol: 'https://findid.org/protocol/sentCrypto', 
    published: true,
    types: {
        payment: {
            schema: 'https://schema.org/sentCrypto', 
            dataFormats: ['application/json']
        }
    },
    structure: {
        payment: {
            $actions: [
                {
                    who: 'anyone',
                    can: ['create', 'read']
                }
            ]
        }
    }
};

export const receivedCryptoProtocol = {
    protocol: 'https://findid.org/protocol/receivedCrypto', 
    published: true,
    types: {
        payment: {
            schema: 'https://schema.org/receivedCrypto', 
            dataFormats: ['application/json']
        }
    },
    structure: {
        payment: {
            $actions: [
                {
                    who: 'anyone',
                    can: ['create', 'read']
                }
            ]
        }
    }
};


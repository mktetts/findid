import { Web5 } from '@web5/api/browser';
import { VerifiableCredential } from '@web5/credentials';
import { Web5UserAgent } from '@web5/user-agent';
import type { Web5Agent } from '@web5/agent';
import { addContactProtocol, addCryptoCardProtocol, myIdentity, receivedCryptoProtocol, sentCryptoProtocol } from './protocols';
import CryptoJS from 'crypto-js';

export default class FinDIDSDK {
    static agent_password = 'insecure-static-phrase';

    static initWeb5 = async () => {
        let connectedDid = sessionStorage.getItem('connectedDid');
        const userAgent = await Web5UserAgent.create();
        if (await userAgent.firstLaunch()) {
            await userAgent.initialize({
                password: FinDIDSDK.agent_password
            });
        }
        await userAgent.start({ password: FinDIDSDK.agent_password });
        const { web5 } = await Web5.connect({ connectedDid, agent: userAgent as Web5Agent });
        return web5;
    };

    static getUserAgent = async () => {
        try {
            const userAgent = await Web5UserAgent.create();
            if (await userAgent.firstLaunch()) {
                await userAgent.initialize({
                    password: FinDIDSDK.agent_password
                });
            }
            await userAgent.start({ password: FinDIDSDK.agent_password });
            return userAgent;
        } catch (e) {
            throw new Error(e.message);
        }
    };
    static checkExistingUserAgent = async () => {
        try {
            const userAgent = await Web5UserAgent.create();
            return (await userAgent.firstLaunch()) ? false : true;
        } catch (e) {
            throw new Error(e.message);
        }
    };

    static checkExistingIdentity = async () => {
        try {
            const userAgent = await Web5UserAgent.create();
            if (await userAgent.firstLaunch()) {
                await userAgent.initialize({
                    password: FinDIDSDK.agent_password
                });
            }
            await userAgent.start({ password: FinDIDSDK.agent_password });
            const identities = await userAgent.identity.list();
            return identities;
        } catch (e) {
            throw new Error(e.message);
        }
    };

    static importIdentity = async (file, jwt, password) => {
        try {
            const userAgent = await Web5UserAgent.create();
            if (await userAgent.firstLaunch()) {
                await userAgent.initialize({
                    password: FinDIDSDK.agent_password
                });
            }
            await userAgent.start({ password: FinDIDSDK.agent_password });
            const decryptedBytes = CryptoJS.AES.decrypt(file, password);
            const decryptedString = decryptedBytes.toString(CryptoJS.enc.Utf8);
            const identity = JSON.parse(decryptedString);
            const metadata = JSON.parse(identity.exportedIdentity.metadata.name);
            if (jwt.email !== metadata.email) throw new Error('Registered Email not matched !!!');
            await userAgent.identity.import({ portableIdentity: identity.exportedIdentity });
            await userAgent.identity.manage({ portableIdentity: identity.exportedIdentity });
            return identity.exportedIdentity.metadata.uri;
        } catch (e) {
            throw new Error(e.message);
        }
    };

    static createIdentity = async data => {
        try {
            const userAgent = await Web5UserAgent.create();
            if (await userAgent.firstLaunch()) {
                await userAgent.initialize({
                    password: FinDIDSDK.agent_password
                });
            }
            await userAgent.start({ password: FinDIDSDK.agent_password });
            const serviceEndpointNodes = ['https://dwn.tbddev.org/beta'];
            const identity = await (
                await userAgent.identity.create({
                    metadata: {
                        name: JSON.stringify(data)
                    },
                    didMethod: 'dht',
                    didOptions: {
                        services: [
                            {
                                id: 'dwn',
                                type: 'DecentralizedWebNode',
                                serviceEndpoint: serviceEndpointNodes,
                                enc: '#enc',
                                sig: '#sig'
                            }
                        ],
                        verificationMethods: [
                            {
                                algorithm: 'Ed25519',
                                id: 'sig',
                                purposes: ['assertionMethod', 'authentication']
                            },
                            {
                                algorithm: 'secp256k1',
                                id: 'enc',
                                purposes: ['keyAgreement']
                            }
                        ]
                    }
                })
            ).export();
            await userAgent.identity.manage({ portableIdentity: identity });
            await userAgent.sync.registerIdentity({ did: identity.portableDid.uri });
            return identity.portableDid.uri;
        } catch (e) {
            throw new Error(e.message);
        }
    };
    static addMyIdentity = async (connectedDid: string, data) => {
        try {
            const userAgent = await Web5UserAgent.create();
            if (await userAgent.firstLaunch()) {
                await userAgent.initialize({
                    password: FinDIDSDK.agent_password
                });
            }
            await userAgent.start({ password: FinDIDSDK.agent_password });
            const { web5, did: myDid } = await Web5.connect({ connectedDid, agent: userAgent as Web5Agent });

            const { protocols, status } = await web5.dwn.protocols.query({
                message: {
                    filter: {
                        protocol: myIdentity.protocol
                    }
                }
            });
            if (status.code === 200) {
                if (protocols.length <= 0) {
                    const { protocol, status } = await web5.dwn.protocols.configure({
                        message: {
                            definition: myIdentity
                        }
                    });
                }
            } else {
                throw status.detail;
            }

            const { record, status: s } = await web5.dwn.records.create({
                data: data,
                message: {
                    schema: myIdentity.types.myIdentity.schema,
                    dataFormat: 'application/json',
                    recipient: myDid,
                    published: false
                }
            });
            await record.send(myDid);
        } catch (e) {
            throw new Error(e.message);
        }
    };
    static retreiveIdentity = async (web5: Web5, connectedDid: string) => {
        try {
            const { protocols, status } = await web5.dwn.protocols.query({
                message: {
                    filter: {
                        protocol: myIdentity.protocol
                    }
                }
            });
            if (status.code === 200) {
                if (protocols.length <= 0) {
                    await web5.dwn.protocols.configure({
                        message: {
                            definition: myIdentity
                        }
                    });
                }
            } else {
                throw status.detail;
            }
            const { records } = await web5.dwn.records.query({
                from: connectedDid,
                message: {
                    filter: {
                        schema: myIdentity.types.myIdentity.schema,
                        dataFormat: 'application/json'
                    }
                }
            });
            // for (const record of records) {
            //     let response = await web5.dwn.records.delete({
            //         from: connectedDid,
            //         message: {
            //             recordId: record.id
            //         }
            //     });
            //     console.log(`delete status: ${response.status.code}`);
            // }
            return records.length ? await records[0].data.json() : [];
        } catch (e) {
            throw new Error(e.message);
        }
    };

    static addCryptoCard = async (web5: Web5, data) => {
        try {
            const { protocols, status } = await web5.dwn.protocols.query({
                message: {
                    filter: {
                        protocol: addCryptoCardProtocol.protocol
                    }
                }
            });
            if (status.code === 200) {
                if (protocols.length <= 0) {
                    await web5.dwn.protocols.configure({
                        message: {
                            definition: addCryptoCardProtocol
                        }
                    });
                }
            } else {
                console.error('Failed to query protocols:', status);
            }
            let connectedDid = sessionStorage.getItem('connectedDid');
            const vc = await VerifiableCredential.create({
                type: 'CryptoCard',
                issuer: connectedDid,
                subject: connectedDid,
                data: data
            });
            const { did: myBearerDid } = await (
                await FinDIDSDK.getUserAgent()
            ).identity.get({
                didUri: connectedDid
            });
            const signedVc = await vc.sign({ did: myBearerDid });
            const { record, status: addCardStatus } = await web5.dwn.records.create({
                data: signedVc,
                message: {
                    schema: addCryptoCardProtocol.types.card.schema,
                    dataFormat: 'application/jwt',
                    published: false
                }
            });
            await record.send(connectedDid);
            return addCardStatus;
        } catch (e) {
            throw new Error(e.message);
        }
    };
    static getCryptoCards = async (web5: Web5, connectedDid: string) => {
        try {
            const { protocols, status } = await web5.dwn.protocols.query({
                message: {
                    filter: {
                        protocol: addCryptoCardProtocol.protocol
                    }
                }
            });
            if (status.code === 200) {
                if (protocols.length <= 0) {
                    await web5.dwn.protocols.configure({
                        message: {
                            definition: addCryptoCardProtocol
                        }
                    });
                }
            } else {
                console.error('Failed to query protocols:', status);
            }

            const { records } = await web5.dwn.records.query({
                message: {
                    filter: {
                        schema: addCryptoCardProtocol.types.card.schema
                    }
                }
            });
            // for (const record of records) {
            //     let response = await web5.dwn.records.delete({
            //         from: connectedDid,
            //         message: {
            //             recordId: record.id
            //         }
            //     });
            //     console.log(`delete status: ${response.status.code}`);

            //     let response1 = await web5.dwn.records.delete({
            //         message: {
            //             recordId: record.id
            //         }
            //     });
            //     console.log(`delete status: ${response1.status.code}`);
            // }
            let allCards = [];
            for (let i = 0; i < records.length; i++) {
                let vcJwt = await records[i].data.text();
                const credential = await VerifiableCredential.verify({ vcJwt });
                allCards.push({ ...credential.vc.credentialSubject, recordId: records[i].id, date: credential.vc.issuanceDate });
            }
            return allCards;
        } catch (e) {
            throw new Error(e.message);
        }
    };

    static deleteCryptoCards = async (web5: Web5, connectedDid: string, cardDetails) => {
        try {
            const { protocols, status } = await web5.dwn.protocols.query({
                message: {
                    filter: {
                        protocol: addCryptoCardProtocol.protocol
                    }
                }
            });
            if (status.code === 200) {
                if (protocols.length <= 0) {
                    await web5.dwn.protocols.configure({
                        message: {
                            definition: addCryptoCardProtocol
                        }
                    });
                }
            } else {
                console.error('Failed to query protocols:', status);
            }

            let responseFromRemote = await web5.dwn.records.delete({
                from: connectedDid,
                message: {
                    recordId: cardDetails.recordId
                }
            });

            let responseFromLocal = await web5.dwn.records.delete({
                message: {
                    recordId: cardDetails.recordId
                }
            });
            return [responseFromLocal, responseFromRemote];
        } catch (e) {
            throw new Error(e.message);
        }
    };
    static getIdentity = async () => {
        try {
            let connectedDid = sessionStorage.getItem('connectedDid');
            const userAgent = await Web5UserAgent.create();
            if (await userAgent.firstLaunch()) {
                await userAgent.initialize({
                    password: FinDIDSDK.agent_password
                });
            }
            await userAgent.start({ password: FinDIDSDK.agent_password });

            const exportedIdentity = await userAgent.identity.export({
                didUri: connectedDid
            });

            return exportedIdentity;
        } catch (e) {
            throw new Error(e.message);
        }
    };

    static addContact = async (web5: Web5, data) => {
        try {
            const { protocols, status } = await web5.dwn.protocols.query({
                message: {
                    filter: {
                        protocol: addContactProtocol.protocol
                    }
                }
            });
            if (status.code === 200) {
                if (protocols.length <= 0) {
                    await web5.dwn.protocols.configure({
                        message: {
                            definition: addContactProtocol
                        }
                    });
                }
            } else {
                console.error('Failed to query protocols:', status);
            }
            let connectedDid = sessionStorage.getItem('connectedDid');

            const { record, status: addContactStatus } = await web5.dwn.records.create({
                data: data,
                message: {
                    schema: addContactProtocol.types.card.schema,
                    dataFormat: 'application/json',
                    published: false
                }
            });
            await record.send(connectedDid);
            return addContactStatus;
        } catch (e) {
            throw new Error(e.message);
        }
    };
    static getContacts = async (web5: Web5, connectedDid: string) => {
        try {
            const { protocols, status } = await web5.dwn.protocols.query({
                message: {
                    filter: {
                        protocol: addContactProtocol.protocol
                    }
                }
            });
            if (status.code === 200) {
                if (protocols.length <= 0) {
                    await web5.dwn.protocols.configure({
                        message: {
                            definition: addContactProtocol
                        }
                    });
                }
            } else {
                console.error('Failed to query protocols:', status);
            }

            const { records } = await web5.dwn.records.query({
                message: {
                    filter: {
                        schema: addContactProtocol.types.card.schema
                    }
                }
            });

            let allContacts = [];
            for (let i = 0; i < records.length; i++) {
                let data = await records[i].data.json();
                allContacts.push({ ...data, recordId: records[i].id });
            }
            return allContacts;
        } catch (e) {
            throw new Error(e.message);
        }
    };

    static storePaymentDetails = async (web5: Web5, data) => {
        try {
            const { protocols, status } = await web5.dwn.protocols.query({
                message: {
                    filter: {
                        protocol: sentCryptoProtocol.protocol
                    }
                }
            });
            if (status.code === 200) {
                if (protocols.length <= 0) {
                    await web5.dwn.protocols.configure({
                        message: {
                            definition: sentCryptoProtocol
                        }
                    });
                }
            } else {
                console.error('Failed to query protocols:', status);
            }
            const { protocols: rp, status: rs } = await web5.dwn.protocols.query({
                message: {
                    filter: {
                        protocol: receivedCryptoProtocol.protocol
                    }
                }
            });
            if (rs.code === 200) {
                if (rp.length <= 0) {
                    await web5.dwn.protocols.configure({
                        message: {
                            definition: receivedCryptoProtocol
                        }
                    });
                }
            } else {
                console.error('Failed to query protocols:', status);
            }
            let connectedDid = sessionStorage.getItem('connectedDid');

            const { record: r1, status: s1 } = await web5.dwn.records.create({
                data: data,
                message: {
                    schema: sentCryptoProtocol.types.payment.schema,
                    dataFormat: 'application/json',
                    published: false,
                    tags: {
                        account: data.sender
                    }
                }
            });
            await r1.send(connectedDid);
            const { record: r2, status: s2 } = await web5.dwn.records.create({
                data: data,
                message: {
                    schema: receivedCryptoProtocol.types.payment.schema,
                    dataFormat: 'application/json',
                    published: false,
                    recipient: data.recipient,
                    tags: {
                        account: data.sender
                    }
                    
                }
            });
            await r1.send(data.recipient);
            if (s1.code === 202 && s2.code === 202) {
                return s1;
            }
            throw new Error('Transaction Completed. Problem in web5');
        } catch (e) {
            throw new Error(e.message);
        }
    };

    static getPaymentDetails = async (web5: Web5, account: string) => {
        try {
            const { protocols, status } = await web5.dwn.protocols.query({
                message: {
                    filter: {
                        protocol: sentCryptoProtocol.protocol
                    }
                }
            });
            if (status.code === 200) {
                if (protocols.length <= 0) {
                    await web5.dwn.protocols.configure({
                        message: {
                            definition: sentCryptoProtocol
                        }
                    });
                }
            } else {
                console.error('Failed to query protocols:', status);
            }
            const { protocols: rp, status: rs } = await web5.dwn.protocols.query({
                message: {
                    filter: {
                        protocol: receivedCryptoProtocol.protocol
                    }
                }
            });
            if (rs.code === 200) {
                if (rp.length <= 0) {
                    await web5.dwn.protocols.configure({
                        message: {
                            definition: receivedCryptoProtocol
                        }
                    });
                }
            } else {
                console.error('Failed to query protocols:', status);
            }
            let connectedDid = sessionStorage.getItem('connectedDid');

            const { records: r1, status: s1 } = await web5.dwn.records.query({
                message: {
                    filter: {
                        schema: sentCryptoProtocol.types.payment.schema,
                        tags: {
                            account: account
                        }
                    }
                }
            });
            const { records: r2, status: s2 } = await web5.dwn.records.query({
                message: {
                    filter: {
                        schema: receivedCryptoProtocol.types.payment.schema,
                        tags: {
                            account: account
                        }
                    }
                }
            });

            let allSentPaymentDetails = [];
            let allReceivedPaymentDetails = [];
            for (let i = 0; i < r1.length; i++) {
                let data = await r1[i].data.json();
                allSentPaymentDetails.push({ ...data, recordId: r1[i].id });
            }
            for (let i = 0; i < r2.length; i++) {
                let data = await r2[i].data.json();
                allReceivedPaymentDetails.push({ ...data, recordId: r2[i].id });
            }
            return {
                sendPaymentDetails: allSentPaymentDetails,
                receivedPaymentDetails: allReceivedPaymentDetails
            };
        } catch (e) {
            throw new Error(e.message);
        }
    };

    static exportIdentity = async (connectedDid: any) => {
        try {
            const userAgent = await Web5UserAgent.create();
            if (await userAgent.firstLaunch()) {
                await userAgent.initialize({
                    password: FinDIDSDK.agent_password
                });
            }
            await userAgent.start({ password: FinDIDSDK.agent_password });
            const { web5, did: myDid } = await Web5.connect({
                connectedDid: connectedDid,
                agent: userAgent as any
            });
            const exportedIdentity = await userAgent.identity.export({
                didUri: myDid
            });
            let data = {
                exportedIdentity: exportedIdentity
            };
            return data;
        } catch (e) {
            throw new Error(e.message);
        }
    };
}

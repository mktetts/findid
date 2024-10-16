import { getIdentity } from '@/blockchain/view-functions/getIdentity';
import { images } from '@/helpers/images';
import FinDIDSDK from '@/sdk';
import useWeb5InstanceStore from '@/store/web5Store';
import React, { useState } from 'react';

import { Modal, Button, Form, Spinner } from 'react-bootstrap';
import { FaUserAlt } from 'react-icons/fa';
import { FaUser } from 'react-icons/fa6';

interface ModalStore {
    state: boolean;
    close: () => void;
}
function AddContact(props: ModalStore) {
    const { getWeb5 } = useWeb5InstanceStore();
    const [recipientAccountAddress, setRecipientAddress] = useState(''); // 704282fb6e3d7a73070d3b5996f924c53cf8c849540ecdacca137de3650a2b9c
    const [errorMessage, setErrorMessage] = useState('');
    const [addContactStarted, setAddContactStarted] = useState(false);
    const [foundAddress, setFoundAddress] = useState(0);
    const [contactName, setContactName] = useState('');
    const [recipientIdentity, setRecipientIdentity] = useState(null);
    const [addStatus, setAddStatus] = useState(null);
    const handleChangeAccountAddress = async recipientAddress => {
        try {
            const identity = (await getIdentity(recipientAddress)) as any;
            setRecipientAddress(recipientAddress);
            setRecipientIdentity(identity);
            if (identity.account !== recipientAddress) {
                throw new Error('Account not registerd with Identity');
            }
            setFoundAddress(1);
        } catch (e) {
            setFoundAddress(2);
        }
    };
    const handleAddContact = async () => {
        try {
            setAddContactStarted(true);
            setFoundAddress(0);
            let data = {
                recipient_did: recipientIdentity.did,
                contact_name: contactName,
                account: recipientAccountAddress
            };
            const status = await FinDIDSDK.addContact(await getWeb5(), data);
            if (status.code === 202) {
                setAddContactStarted(false);
                setAddStatus(status);
            }
        } catch (e) {
            setErrorMessage(e.message);
        }
    };

    return (
        <div>
            <Modal show={props.state} onHide={props.close}>
                <Modal.Header closeButton>
                    <Modal.Title>Add Contact</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className='form-floating custom-form-floating form-group mb-3 mt-2'>
                        <Form.Control
                            type='text'
                            className='form-control'
                            value={recipientAccountAddress}
                            required
                            onChange={e => {
                                setRecipientAddress(e.target.value);
                                handleChangeAccountAddress(e.target.value);
                            }}
                        />
                        <label>
                            <FaUser className='me-2' />
                            Recipient Account Address (without 0x)
                        </label>
                    </div>
                    {foundAddress > 0 && (
                        <div className='form-floating custom-form-floating form-group mb-3 mt-5'>
                            <Form.Control
                                type='text'
                                className='form-control'
                                value={contactName}
                                required
                                onChange={e => {
                                    setContactName(e.target.value);
                                }}
                            />
                            <label>
                                <FaUser className='me-2' />
                                Name your Contact
                            </label>
                        </div>
                    )}
                    {foundAddress === 1 && (
                        <div className='d-flex mt-2'>
                            <img src={images.okImage} height={30} width={30} />
                            <p className='ms-2 mt-1'>Recipient Account Verified with Identity</p>
                        </div>
                    )}
                    {foundAddress === 2 && (
                        <div className='d-flex mt-2'>
                            <img src={images.crossImage} height={30} width={30} />
                            <p className='ms-2'>Recipient Account not Verified with Identity. Add with your own decision.</p>
                        </div>
                    )}
                     {addContactStarted && (
                    <div className='d-flex justify-content-center align-items-center mt-3'>
                        <Spinner animation='border' role='status' variant='primary' style={{ width: '2rem', height: '2rem' }}>
                            <span className='visually-hidden'>Loading...</span>
                        </Spinner>
                    </div>
                )}
                    {addStatus?.code === 202 && (
                        <div className='d-flex justify-content-center align-item-center'>
                            <img
                                src={images.okImage}
                                alt='Selected'
                                style={{
                                    width: '30px',
                                    height: '30px',
                                    borderRadius: '50%',
                                    marginTop: '15px',
                                    // marginBottom: '10px',
                                    objectFit: 'cover'
                                }}
                            />
                            <h3 className='mt-3 fs-5'>Contact Added</h3>
                        </div>
                    )}
                    {addStatus?.code !== 202 && addStatus && (
                        <div className='d-flex justify-content-center align-item-center'>
                            <img
                                src={images.crossImage}
                                alt='Selected'
                                style={{
                                    width: '30px',
                                    height: '30px',
                                    borderRadius: '50%',
                                    marginTop: '15px',
                                    // marginBottom: '10px',
                                    objectFit: 'cover'
                                }}
                            />
                            <h3 className='mt-3 fs-5'>Adding Contact Failed</h3>
                        </div>
                    )}
                    {errorMessage && (
                        <div>
                            <p
                                className='text-danger text-center mt-2'
                                style={{
                                    wordWrap: 'break-word',
                                    overflowWrap: 'break-word'
                                }}
                            >
                                {errorMessage}
                            </p>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    {!addStatus && (
                        <Button variant='primary' disabled={!(recipientAccountAddress && contactName)} onClick={handleAddContact}>
                            <FaUserAlt className='me-1' />
                            Add Contact
                        </Button>
                    )}
                </Modal.Footer>
            </Modal>
        </div>
    );
}

export default AddContact;

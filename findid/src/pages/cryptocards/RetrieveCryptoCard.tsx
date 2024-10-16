import FinDIDSDK from '@/sdk';
import { useEffect, useRef, useState } from 'react';
import { Button, Col, Form, Modal, Row, Spinner } from 'react-bootstrap';
import { FaAddressCard, FaLock, FaUser } from 'react-icons/fa6';

import GoogleLogo from '@/components/GoogleLogo';
import { images } from '@/helpers/images';
import { KeyManager } from '@/blockchain/utils/keyManagement';
import useWeb5InstanceStore from '@/store/web5Store';
import { registerIdentity } from '@/blockchain/entry-functions/registerIdentity';
import { signTransactionForRegisteringIdentity } from '@/blockchain/utils/signTransaction';
import { getIdentity } from '@/blockchain/view-functions/getIdentity';

interface ModalStore {
    state: boolean;
    close: () => void;
}
function RetrieveCryptoCard(props: ModalStore) {
    const { getWeb5 } = useWeb5InstanceStore();
    const [connectedDid, setConnectedDid] = useState('');
    const [identity, setIdentity] = useState(null);
    const [accountAddress, setAccountAddress] = useState('');
    const [retrieveCardStarted, setRetrieveCardStarted] = useState(false);
    const [addStatus, setAddStatus] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');
    useEffect(() => {
        let connectedDid = sessionStorage.getItem('connectedDid');
        let identity = sessionStorage.getItem('identity');
        setConnectedDid(connectedDid);
        setIdentity(JSON.parse(identity));
    }, []);
    const [pin, setPin] = useState(['', '', '', '']);
    const [showPin, setShowPin] = useState(false);
    const inputRefs = useRef([]);
    
    const isPinComplete = pin.every((digit) => digit !== "");
    const handleInputChange = (value, index) => {
        // If it's a valid digit, update the corresponding pin index
        if (/^[0-9]$/.test(value)) {
            const newPin = [...pin];
            newPin[index] = value;
            setPin(newPin);

            // Move focus to the next input field
            if (index < 3 && value !== '') {
                inputRefs.current[index + 1].focus();
            }
        }
    };

    const handleBackspace = index => {
        // Clear the current input value
        const newPin = [...pin];
        newPin[index] = ''; // Clear the current value
        setPin(newPin);

        // If there is a previous input, move the focus to it
        if (index > 0) {
            inputRefs.current[index - 1].focus();
        }
    };
   
    const handleRetrieveCryptoCard = async () => {
        try {
            setRetrieveCardStarted(true);
            
            const identity = await getIdentity(accountAddress) as any
            if(!identity.account){
                throw new Error("Account not registerd with Identity")
            }
            const account = await KeyManager.getPrivateKeyFromIdentity({salt: identity.salt}, pin);
            if(account.accountAddress.toString().slice(2) !== accountAddress){
                throw new Error("Wrong Pin. Account Mismatched")
            }
            let key = await KeyManager.retrivePrivateKeyFromIdentity(identity.salt, pin);
            const status = await FinDIDSDK.addCryptoCard(await getWeb5(), { ...key, accountName: identity.virtual_name });
            if (status.code === 202) {
                setRetrieveCardStarted(false);
                setAddStatus(status);
            }
            setErrorMessage("");
        } catch (e) {
            setErrorMessage(e.message);
        }
    };
   
    return (
        <Modal show={props.state} onHide={props.close} backdrop='static' keyboard={false}>
            <Modal.Header closeButton>
                <Modal.Title>Retrieve Crypto Card</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div className='form-floating custom-form-floating form-group mb-3 mt-2'>
                    <Form.Control
                        type='text'
                        className='form-control'
                        value={accountAddress}
                        required
                        onChange={e => setAccountAddress(e.target.value)}
                    />
                    <label>
                        <FaUser className='me-2' />
                        Account Address (without 0x)
                    </label>
                </div>
                <div>
                    <Row>
                        <div className='d-flex justify-content-between align-items-center mb-3 mt-3'>
                            <label className='form-check-label fs-6'>Enter Pin</label>
                            <div className='d-flex align-items-center'>
                                <Form.Check
                                    type='switch'
                                    id='show-pin-toggle'
                                    checked={showPin}
                                    onChange={() => setShowPin(!showPin)}
                                    className='me-1'
                                />
                                <label className='form-check-label mt-1'>{showPin ? 'Hide' : 'Show'}</label>
                            </div>
                        </div>
                        {pin.map((digit, index) => (
                            <Col xs={3} key={index}>
                                <Form.Control
                                    type={showPin ? 'text' : 'password'}
                                    maxLength={1}
                                    value={digit}
                                    onChange={e => handleInputChange(e.target.value, index)}
                                    onKeyDown={e => {
                                        const input = e.target as HTMLInputElement;
                                        if (e.key === 'Backspace' && input.value === '') {
                                            handleBackspace(index); 
                                        } else if (e.key === 'Backspace' && input.value !== '') {
                                            handleBackspace(index);
                                        }
                                    }}
                                    ref={el => (inputRefs.current[index] = el)}
                                    style={{ textAlign: 'center', fontSize: '2rem' }}
                                />
                            </Col>
                        ))}
                    </Row>
                    <Row className='mt-3'>
                        <Col className='d-flex align-items-center'></Col>
                    </Row>
                </div>
               

                {retrieveCardStarted && (
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
                        <h3 className='mt-3 fs-5'>Crypto Card Retrived</h3>
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
                                objectFit: 'cover',
                                border: '4px solid white'
                            }}
                        />
                        <h3 className='mt-3 fs-5'>Retrieving Crypto Card Failed</h3>
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
                    <Button variant='secondary' onClick={handleRetrieveCryptoCard} disabled={!(isPinComplete && accountAddress)}>
                        <FaAddressCard color='orange' className='fs-5' />
                        <span className='ms-2'>Retrieve Crypto Card</span>
                    </Button>
                )}
            </Modal.Footer>
        </Modal>
    );
}

export default RetrieveCryptoCard;

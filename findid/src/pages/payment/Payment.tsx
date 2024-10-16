import React, { useEffect, useRef, useState } from 'react';
import { Form, Button, Card, Dropdown, DropdownButton, InputGroup, Image, Modal, Row, Col, Spinner } from 'react-bootstrap';
import AddContact from './AddContact';
import useWeb5InstanceStore from '@/store/web5Store';
import FinDIDSDK from '@/sdk';
import Loader from '@/components/Loader';
import { FaAddressCard, FaMoneyBill } from 'react-icons/fa6';
import { images } from '@/helpers/images';
import { getAccountCoinsData } from '@/blockchain/view-functions/getAccountCoins';
import { excecuteSendCryptoTransaction } from '@/blockchain/entry-functions/sendCrypto';

function Payment() {
    const { getWeb5 } = useWeb5InstanceStore();
   
    const [connectedDid, setConnectedDid] = useState('');
    const [filteredContacts, setFilteredContacts] = useState([]);
    const [selectedContact, setSelectedContact] = useState(null);
    const [searchInput, setSearchInput] = useState('');
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [warning, setWarning] = useState('');
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState('');
    const [isChatBoxOpen, setIsChatBoxOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('Open');
    const [addContactModal, setAddContactModal] = useState(false);
    const [allContacts, setAllContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [allCards, setAllCards] = useState([]);
    const [allCoins, setAllCoins] = useState([]);
    const [selectedOption, setSelectedOption] = useState('Payment');
    const [message, setMessage] = useState('');
    const [amount, setAmount] = useState('');
    const [selectedCrypto, setSelectedCrypto] = useState(null);
    const [cryptoBalance, setCryptoBalance] = useState([]);
    const [error, setError] = useState('');
    const [retrieveCardStarted, setRetrieveCardStarted] = useState(false);
    const [addStatus, setAddStatus] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [openSendCryptoModal, setOpenSendCryptoModal] = useState(false);
    const [notes, setNotes] = useState('');
    useEffect(() => {
        let connectedDid = sessionStorage.getItem('connectedDid');
        setConnectedDid(connectedDid);
        init();
    }, []);

    const init = async () => {
        
        const cards = await FinDIDSDK.getCryptoCards(await getWeb5(), connectedDid);
        if (!cards.length) {
            setLoading(false);
            return;
        }
        setAllCards(cards);
        const contacts = await FinDIDSDK.getContacts(await getWeb5(), connectedDid);
        setAllContacts(contacts);
        const allCoins = await getAccountCoinsData(cards[0].address);
        setCryptoBalance(allCoins);
        setSelectedCrypto(allCoins[0]);
        setLoading(false);
    };
    // Toggle chatbox visibility
    const toggleChatBox = contact => {
        setIsChatBoxOpen(!isChatBoxOpen);
        setSelectedContact(contact);
    };
    const handleSearchChange = e => {
        const value = e.target.value;
        setSearchInput(value);
        const filtered = allContacts.filter(contact => contact.name.toLowerCase().includes(value.toLowerCase()));
        setFilteredContacts(filtered);
    };

    // const handleSelectContact = contact => {
    //     setSelectedContact(contact);
    //     setWarning(''); // Clear any previous warnings
    // };

    // const handleAddContact = () => {
    //     if (searchInput && !contacts.some(c => c.name.toLowerCase() === searchInput.toLowerCase())) {
    //         const newContact = { name: searchInput, role: 'New Contact', picture: 'https://via.placeholder.com/40' };
    //         setContacts([...contacts, newContact]);
    //         setFilteredContacts([...filteredContacts, newContact]);
    //         setSearchInput(''); // Clear the input after adding
    //         setWarning(''); // Clear any warnings
    //     } else {
    //         setWarning('Contact already exists or input is empty.');
    //     }
    // };

    const handleAccountSelect = account => {
        setSelectedAccount(account);
    };

    const [searchTerm, setSearchTerm] = useState('');
    const filteredAccounts = allCards.filter(
        account =>
            account.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            account.address.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const formatString = (str: string) => {
        if (!str) return '';
        if (str.length <= 20) {
            return str;
        }
        return str.slice(0, 10) + '***' + str.slice(-10);
    };

    const handleOptionChange = option => {
        setSelectedOption(option);
        setAmount('');
        setMessage('');
        setError('');
    };

    const handleCryptoChange = async cryptoSymbol => {
        const allCoin = await getAccountCoinsData(selectedAccount.address);
        setCryptoBalance(allCoin);
        const selected = allCoin.find(crypto => crypto.symbol === cryptoSymbol);
        setSelectedCrypto(selected);
        setAmount('');
        setError('');
    };
    const handleAmountChange = e => {
        const value = e.target.value;
        setAmount(value);

        if (parseFloat(value) > cryptoBalance[selectedCrypto]) {
            setError('Amount is greater than available balance');
        } else {
            setError('');
        }
    };
    const [pin, setPin] = useState(['', '', '', '']);
    const [showPin, setShowPin] = useState(false);
    const inputRefs = useRef([]);

    const isPinComplete = pin.every(digit => digit !== '');
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
    const handleSendAmount = async () => {
        try {
            setRetrieveCardStarted(true);
            const transactionData = {
                amount: Math.round(parseFloat(amount) * Math.pow(10, selectedCrypto.decimal)),
                to: selectedContact.account,
                typeArguments: selectedCrypto.asset_type
            };
            const res = await excecuteSendCryptoTransaction(selectedAccount, pin, transactionData);
            if (!res.success) {
                throw new Error('Unknown Error');
            }
            if (selectedContact.recipient_did !== '') {
                let data = {
                    sender: selectedAccount.address,
                    receiver: selectedContact.account,
                    amount: (parseFloat(amount)),
                    token: selectedCrypto.symbol,
                    notes: notes,
                    timestamp: new Date(Date.now()).toLocaleString(),
                    recipient: selectedContact.recipient_did
                };
                const status = await FinDIDSDK.storePaymentDetails(await getWeb5(), data);
                if (status.code === 202) {
                    setRetrieveCardStarted(false);
                    setAddStatus(status);
                }
                setErrorMessage('');
            } else {
                setRetrieveCardStarted(false);
                setAddStatus({
                    code: 202
                });
            }
        } catch (e) {
            setErrorMessage(e.message);
        }
    };

    if (loading) {
        return <Loader />;
    }
    if(!allCards.length){
        return <div>
            <h3>Please create Atleast one account to make payments</h3>
        </div>
    }
    return (
        <div>
            <section className='message-area'>
                <div className='row'>
                    <div className='col-12'>
                        <div className='chat-area'>
                            <div className='chatlist'>
                                <div className='modal-dialog-scrollable'>
                                    <div className='modal-content'>
                                        <div className='chat-header mt-3'>
                                            <div className='d-flex align-items-center ms-3'>
                                            <h5 className='ms-1 me-5 mt-4 mb-3'>Your Contacts</h5>

                                                <a className='add ms-2 me-2' href='#'>
                                                    <img
                                                        className='img-fluid'
                                                        src='https://mehedihtml.com/chatbox/assets/img/add.svg'
                                                        alt='add'
                                                        onClick={() => setAddContactModal(true)}
                                                    />
                                                </a>
                                            </div>

                                        </div>

                                        <div className='modal-body'>
                                            <div className='chat-lists'>
                                                {activeTab === 'Open' && (
                                                    <div className='tab-pane fade show active'>
                                                        <div className='chat-list'>
                                                            {allContacts.map((contact, index) => (
                                                                <div key={index}>
                                                                    {' '}
                                                                    {/* Added key for each item */}
                                                                    <a
                                                                        href='#'
                                                                        className='d-flex align-items-center'
                                                                        onClick={() => toggleChatBox(contact)}
                                                                    >
                                                                        <div className='flex-shrink-0'>
                                                                            <img
                                                                                className='img-fluid'
                                                                                src={images.userImage}
                                                                                alt='user img'
                                                                                height={30}
                                                                                width={30}
                                                                            />
                                                                        </div>

                                                                        <div className='flex-grow-1 ms-3'>
                                                                            <h3>{contact.contact_name}</h3>{' '}
                                                                            <p>{formatString(contact.account)}</p>{' '}
                                                                        </div>
                                                                    </a>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Closed Tab */}
                                                {activeTab === 'Closed' && (
                                                    <div className='tab-pane fade'>
                                                        <div className='chat-list'>
                                                            {allContacts.map((contact, index) => (
                                                                <div key={index}>
                                                                    {' '}
                                                                    {/* Added key for each item */}
                                                                    <a
                                                                        href='#'
                                                                        className='d-flex align-items-center'
                                                                        onClick={toggleChatBox}
                                                                    >
                                                                        <div className='flex-shrink-0'>
                                                                            <img
                                                                                className='img-fluid'
                                                                                src={images.userImage}
                                                                                alt='user img'
                                                                                height={30}
                                                                                width={30}
                                                                            />
                                                                        </div>

                                                                        <div className='flex-grow-1 ms-3'>
                                                                            <h3>{contact.contact_name}</h3>{' '}
                                                                            <p>{formatString(contact.account)}</p>{' '}
                                                                        </div>
                                                                    </a>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Chatbox */}
                            <div className={`chatbox modal-dialog-scrollable ${isChatBoxOpen ? 'showbox' : ''}`}>
                                <div className='modal-content'>
                                    {selectedContact ? (
                                        <div>
                                            <div className='msg-head'>
                                                <div className='row'>
                                                    <div className='col-9'>
                                                        <div className='d-flex align-items-center'>
                                                            <span className='chat-icon' onClick={toggleChatBox}>
                                                                <img
                                                                    className='img-fluid'
                                                                    src='https://mehedihtml.com/chatbox/assets/img/arroleftt.svg'
                                                                    alt='back'
                                                                />
                                                            </span>
                                                            <div className='flex-shrink-0 ms-2'>
                                                                <img
                                                                    className='img-fluid'
                                                                    src={images.userImage}
                                                                    alt='user img'
                                                                    height={30}
                                                                    width={30}
                                                                />
                                                            </div>
                                                            <div className='flex-grow-1 ms-3'>
                                                                <h3>{selectedContact.contact_name}</h3>
                                                                <p>{formatString(selectedContact.account)}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className='col-4'>
                                                        <ul className='moreoption'>
                                                            <li className='navbar nav-item dropdown'>
                                                                <a
                                                                    className='nav-link dropdown-toggle'
                                                                    href='#'
                                                                    role='button'
                                                                    data-bs-toggle='dropdown'
                                                                    aria-expanded='false'
                                                                >
                                                                    <i className='fa fa-ellipsis-v' />
                                                                </a>
                                                                <ul className='dropdown-menu'>
                                                                    <li>
                                                                        <a className='dropdown-item' href='#'>
                                                                            Action
                                                                        </a>
                                                                    </li>
                                                                    <li>
                                                                        <a className='dropdown-item' href='#'>
                                                                            Another action
                                                                        </a>
                                                                    </li>
                                                                    <li>
                                                                        <hr className='dropdown-divider' />
                                                                    </li>
                                                                    <li>
                                                                        <a className='dropdown-item' href='#'>
                                                                            Something else here
                                                                        </a>
                                                                    </li>
                                                                </ul>
                                                            </li>
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>
                                            {!cryptoBalance.length ? (<>
                                                <h5 className='text-center mt-5'> You dont have any coins to make paymnet </h5>
                                            </>) : (<>
                                            
                                            <div className='modal-body'>
                                                <Card
                                                    className='p-4'
                                                    style={{
                                                        maxWidth: '500px',
                                                        margin: '0 auto',
                                                        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
                                                    }}
                                                >
                                                    <Card.Body>
                                                        <h5 className='mb-4'>Send Payment</h5>

                                                        <Form.Group className='mb-3'>
                                                            <Form.Label>Select Account</Form.Label>
                                                            <DropdownButton
                                                                title={
                                                                    selectedAccount?.accountName
                                                                        ? selectedAccount?.accountName
                                                                        : 'Select Account'
                                                                }
                                                                variant='secondary'
                                                                className='w-100'
                                                            >
                                                                <Form.Control
                                                                    type='text'
                                                                    placeholder='Search account...'
                                                                    value={searchTerm}
                                                                    onChange={e => setSearchTerm(e.target.value)}
                                                                    className='mb-2'
                                                                />
                                                                <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                                                                    {filteredAccounts.map((account, index) => (
                                                                        <Dropdown.Item
                                                                            key={index}
                                                                            eventKey={index}
                                                                            onClick={() => handleAccountSelect(account)}
                                                                        >
                                                                            {account.accountName} -{' '}
                                                                            {formatString(account.address)}
                                                                        </Dropdown.Item>
                                                                    ))}
                                                                </div>
                                                            </DropdownButton>
                                                        </Form.Group>

                                                        <Form.Group className='mb-3'>
                                                            <Form.Label>Select Cryptocurrency</Form.Label>
                                                            <DropdownButton
                                                                title={selectedCrypto.name}
                                                                onSelect={handleCryptoChange}
                                                                variant='secondary'
                                                                className='w-100'
                                                            >
                                                                {cryptoBalance.map(crypto => (
                                                                    <Dropdown.Item key={crypto.symbol} eventKey={crypto.symbol}>
                                                                        <Image
                                                                            src={crypto.image}
                                                                            alt={crypto.name}
                                                                            width={20}
                                                                            height={20}
                                                                            className='me-2'
                                                                        />
                                                                        {crypto.name} ({crypto.symbol})
                                                                    </Dropdown.Item>
                                                                ))}
                                                            </DropdownButton>
                                                        </Form.Group>

                                                        <Form.Group className='mb-3'>
                                                            <Form.Label>Amount</Form.Label>
                                                            <Form.Control
                                                                type='number'
                                                                placeholder='Enter amount'
                                                                value={amount}
                                                                onChange={handleAmountChange}
                                                            />
                                                        </Form.Group>

                                                        <Form.Group className='mb-3'>
                                                            <Form.Label>Balance</Form.Label>
                                                            <Form.Control
                                                                type='text'
                                                                value={
                                                                    selectedCrypto
                                                                        ? `Balance: ${selectedCrypto.amount} ${selectedCrypto.symbol}`
                                                                        : 'Balance: N/A'
                                                                }
                                                                disabled
                                                            />
                                                        </Form.Group>
                                                        <Form.Group className='mb-3' controlId='exampleForm.ControlTextarea1'>
                                                            <Form.Label>Add Notes (Optional)</Form.Label>
                                                            <Form.Control
                                                                as='textarea'
                                                                rows={2}
                                                                max={3}
                                                                value={notes}
                                                                onChange={e => setNotes(e.target.value)}
                                                            />
                                                        </Form.Group>
                                                        <Button
                                                            variant='primary'
                                                            disabled={
                                                                !amount ||
                                                                !selectedCrypto ||
                                                                parseFloat(amount) > selectedCrypto.amount ||
                                                                !selectedAccount
                                                            }
                                                            className='w-100'
                                                            onClick={() => setOpenSendCryptoModal(true)}
                                                        >
                                                            Send Amount
                                                        </Button>
                                                        {error && <div className='text-danger mt-3'>{error}</div>}
                                                    </Card.Body>
                                                </Card>
                                            </div>
                                            </>)}
                                        </div>
                                    ) : (
                                        <div
                                            className='d-flex flex-column align-items-center justify-content-center'
                                            style={{ marginTop: '200px' }}
                                        >
                                            <div className='mb-3'>
                                                <FaAddressCard size={100} />
                                            </div>
                                            <div>
                                                <h3>Please select any Contact</h3>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <Modal
                show={openSendCryptoModal}
                onHide={() => {
                    setOpenSendCryptoModal(false);
                    window.location.reload();
                }}
                backdrop='static'
                keyboard={false}
            >
                <Modal.Header closeButton>
                    <Modal.Title>Send Crypto</Modal.Title>
                </Modal.Header>
                <Modal.Body>
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
                            <h3 className='mt-3 fs-5'>Successfully Sent</h3>
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
                            <h3 className='mt-3 fs-5'>Sending Crypto Failed</h3>
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
                        <Button variant='secondary' onClick={handleSendAmount} disabled={!isPinComplete}>
                            <FaMoneyBill color='orange' className='fs-5' />
                            <span className='ms-2'>Send Crypto</span>
                        </Button>
                    )}
                </Modal.Footer>
            </Modal>
            <AddContact
                state={addContactModal}
                close={() => {
                    setAddContactModal(false);
                    sessionStorage.removeItem('allContacts');
                    window.location.reload();
                }}
            />
        </div>
    );
}

export default Payment;

import { images } from '@/helpers/images';
import React, { useEffect, useRef, useState } from 'react';
import { Accordion, Button, Col, Form, Offcanvas, Row, Spinner } from 'react-bootstrap';
import AddCryptoCard from './AddCryptoCard';
import FinDIDSDK from '@/sdk';
import useWeb5InstanceStore from '@/store/web5Store';
import Loader from '@/components/Loader';
import { format } from 'path';
import { FiCheck, FiCopy } from 'react-icons/fi';
import { getAccountCoinsData } from '@/blockchain/view-functions/getAccountCoins';
import { KeyManager } from '@/blockchain/utils/keyManagement';
import { FaRegCopy } from 'react-icons/fa6';
import RetrieveCryptoCard from './RetrieveCryptoCard';

function CryptoCards() {
    const { getWeb5 } = useWeb5InstanceStore();
    const [openAddCardModal, setOpenAddCardModal] = useState(false);
    const [openRetrieveModal, setOpenRetrieveModal] = useState(false);
    const [connectedDid, setConnectedDid] = useState('');
    const [allCards, setAllCards] = useState([]);
    const [errorMessage, setErrorMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [isCopied, setIsCopied] = useState(false);
    const [copiedIndex, setCopiedIndex] = useState(null);
    const [showCanvas, setShowCanvas] = useState(false);
    const [selectedCard, setSelectedCard] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [allCoins, setAllCoins] = useState([]);
    const [privateKey, setPrivateKey] = useState('');
    const [deletionStarted, setDeletionStarted] = useState(false);
    const [status, setStatus] = useState('');
    useEffect(() => {
        let connectedDid = sessionStorage.getItem('connectedDid');
        setConnectedDid(connectedDid);
        init();
    }, []);

    const init = async () => {
        try {
            let allCards = sessionStorage.getItem('allCards');
            if (!allCards) {
                const cards = await FinDIDSDK.getCryptoCards(await getWeb5(), connectedDid);
                setAllCards(cards);
                sessionStorage.setItem('allCards', JSON.stringify(cards));
                setLoading(false);
            } else {
                setAllCards(JSON.parse(allCards));
                setLoading(false);
            }
        } catch (e) {
            setErrorMessage(e.message);
        }
    };
    const formatString = (str: string) => {
        if (str.length <= 20) {
            return str;
        }
        return str.slice(0, 10) + '***' + str.slice(-10);
    };
    const handleCopy = (text, index) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedIndex(index);
            setTimeout(() => setCopiedIndex(null), 2000);
        });
    };
    const handleSCopy = text => {
        navigator.clipboard
            .writeText(text)
            .then(() => {
                setIsCopied(true); // Set the copied state to true when copied
                setTimeout(() => setIsCopied(false), 2000); // Reset back to copy icon after 2 seconds
            })
            .catch(err => {
            });
    };
    const handleOpenCanvas = async card => {
        const allCoins = await getAccountCoinsData(card.address);
        setAllCoins(allCoins);
        setSelectedCard({ ...card, allCoins });
        setShowCanvas(true);
    };
    const handleCloseCanvas = () => {
        setSelectedCard(null);
        setShowCanvas(false);
        setPrivateKey('');
        setPin(['', '', '', '']);
    };

    const handleSearchChange = e => {
        setSearchQuery(e.target.value);
    };

    // Filter coins based on search query
    const filteredCoins = allCoins.filter(
        coin =>
            coin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            coin.symbol.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
        const newPin = [...pin];
        newPin[index] = '';
        setPin(newPin);
        if (index > 0) {
            inputRefs.current[index - 1].focus();
        }
    };
    const [inputValue, setInputValue] = useState('');

    const handlePKCopy = () => {
        navigator.clipboard
            .writeText(inputValue)
            .then(() => {
                alert('Copied to clipboard!');
            })
            .catch(err => {
            });
    };
    const handleExportPrivateKey = async () => {
        try {
            const privateKey = await KeyManager.retrievePrivateKey(selectedCard, pin);
            setPrivateKey(privateKey);
            setErrorMessage('');
        } catch (e) {
            setErrorMessage(e.message);
        }
    };

    const handleDeleteAccount = async () => {
        try {
            await KeyManager.checkCorrectPinForAccount(selectedCard, pin);
            setDeletionStarted(true);
            const [responseFromLocal, responseFromRemote] = await FinDIDSDK.deleteCryptoCards(
                await getWeb5(),
                connectedDid,
                selectedCard
            );
            if(responseFromLocal.status.code === 202 && responseFromRemote.status.code === 202){
                setStatus("Account Deleted...")
                setDeletionStarted(false);
                sessionStorage.removeItem("allCards")
            }else{
                setStatus("Unkown error")
            }
        } catch (e) {
            setErrorMessage(e.message);
        }
    };

    const handleRetriveAccount = async() =>{

    }
    if (loading) {
        return <Loader />;
    }
    return (
        <div>
            <div>
                <h3>Your Crypto Cards</h3>
                {errorMessage && <div className='text-danger'>{errorMessage}</div>}
                <div className='d-flex grid-4-auto gap-card float-end'>
                    <Button onClick={() => setOpenAddCardModal(true)}>Add</Button>
                    <Button onClick={() => setOpenRetrieveModal(true)}>Retrieve</Button>
                </div>
                <br />
                {!allCards.length && (
                    <p className='text-danger text-center fs-3 mt-5'> No Crypto Cards found. Please add atleast one card.</p>
                )}
                <div className='row mt-5'>
                    <div className='col-xl'>
                        <div className='text-start d-flex flex-wrap align-item-center '>
                            {allCards.length && (
                                <>
                                    {allCards.map((card, index) => (
                                        <div className='credit-card me-3 mb-3' key={index}>
                                            <div className='provider d-flex'>
                                                <img src={images.aptosImage} width={40} height={40} />
                                                <span className='mt-2'>Aptos </span>
                                            </div>
                                            <div className='number'>
                                                {formatString(card.address)}{' '}
                                                {copiedIndex === index ? (
                                                    <FiCheck className='ms-2 text-success' />
                                                ) : (
                                                    <FiCopy
                                                        className='ms-2'
                                                        style={{ cursor: 'pointer' }}
                                                        onClick={() => handleCopy(card.address, index)}
                                                    />
                                                )}
                                            </div>

                                            <div className='good-through-label'>
                                                Created
                                                <br />
                                                on
                                            </div>
                                            <div className='good-through-value'>{card.date.split('T')[0]}</div>
                                            <div className='holder text-success'>{card.accountName}</div>

                                            <Button
                                                className='select'
                                                size='sm'
                                                variant='secondary'
                                                onClick={() => handleOpenCanvas(card)}
                                            >
                                                View
                                            </Button>
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>
                    </div>
                </div>
                {selectedCard && (
                    <Offcanvas show={showCanvas} onHide={handleCloseCanvas} placement='end' backdrop='static'>
                        <Offcanvas.Header closeButton>
                            <Offcanvas.Title>
                                <img src={images.aptosImage} width={40} height={40} />
                                {selectedCard.accountName}
                            </Offcanvas.Title>
                        </Offcanvas.Header>
                        <Offcanvas.Body>
                            <div>
                                <div className='number'>
                                    Address: {formatString(selectedCard.address)}{' '}
                                    {isCopied ? (
                                        <FiCheck className='ms-2 text-success' /> // Checkmark icon when copied
                                    ) : (
                                        <FiCopy
                                            className='ms-2'
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => handleSCopy(selectedCard.address)}
                                        /> // Copy icon before it's copied
                                    )}
                                </div>

                                <Form.Group className='mb-3 mt-5'>
                                    <Form.Control
                                        type='text'
                                        placeholder='Search coins by name or symbol'
                                        value={searchQuery}
                                        onChange={handleSearchChange}
                                    />
                                </Form.Group>

                                {/* Scrollable coin list */}
                                <div
                                    style={{
                                        maxHeight: '400px', // Set a fixed height with overflow
                                        overflowY: 'scroll'
                                    }}
                                >
                                    {filteredCoins.length > 0 ? (
                                        filteredCoins.map((coin, index) => (
                                            <div
                                                key={index}
                                                className='d-flex align-items-center mb-3'
                                                style={{ height: '60px' }} // Set a height for each coin row
                                            >
                                                <div className='me-3'>
                                                    {coin.image ? (
                                                        <img
                                                            src={coin.image}
                                                            alt={coin.name.slice(-3)}
                                                            style={{ width: '40px', height: '40px' }}
                                                        />
                                                    ) : (
                                                        <div
                                                            style={{
                                                                width: '40px',
                                                                height: '40px',
                                                                backgroundColor: '#ccc',
                                                                borderRadius: '50%'
                                                            }}
                                                        ></div>
                                                    )}
                                                </div>
                                                <div>
                                                    <strong>{coin.name}</strong> ({coin.symbol})<div>Amount: {coin.amount}</div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className='text-center mt-3'>No coins found</p>
                                    )}
                                </div>
                                <div className='mt-5'>
                                    <Accordion>
                                        <Accordion.Item eventKey='0'>
                                            <Accordion.Header>Export Private Key</Accordion.Header>
                                            <Accordion.Body>
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
                                                            <label className='form-check-label mt-1'>
                                                                {showPin ? 'Hide' : 'Show'}
                                                            </label>
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

                                                    {errorMessage && (
                                                        <p className='text-danger mt-3 text-center'>{errorMessage}</p>
                                                    )}
                                                    {!privateKey && (
                                                        <div className='d-flex justify-content-center align-item-center'>
                                                            <Button
                                                                className='mt-2'
                                                                onClick={handleExportPrivateKey}
                                                                disabled={!isPinComplete}
                                                            >
                                                                Export
                                                            </Button>
                                                        </div>
                                                    )}
                                                    {privateKey && (
                                                        <div className='d-flex align-items-center'>
                                                            <input
                                                                type='password'
                                                                value={privateKey}
                                                                disabled
                                                                placeholder='Enter text to copy'
                                                                className='form-control me-2 mt-4'
                                                                style={{ marginRight: '10px', padding: '5px' }}
                                                            />
                                                            <button
                                                                onClick={handlePKCopy}
                                                                className='mt-4'
                                                                style={{ background: 'white', border: 'none', cursor: 'pointer' }}
                                                            >
                                                                <FaRegCopy size={15} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </Row>
                                            </Accordion.Body>
                                        </Accordion.Item>
                                        <Accordion.Item eventKey='1'>
                                            <Accordion.Header>Delete this account</Accordion.Header>
                                            <Accordion.Body>
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
                                                            <label className='form-check-label mt-1'>
                                                                {showPin ? 'Hide' : 'Show'}
                                                            </label>
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

                                                    {errorMessage && (
                                                        <p className='text-danger mt-3 text-center'>{errorMessage}</p>
                                                    )}
                                                     {deletionStarted && (
                                                        <div className='d-flex justify-content-center align-items-center mt-3'>
                                                            <Spinner
                                                                animation='border'
                                                                role='status'
                                                                variant='primary'
                                                                style={{ width: '2rem', height: '2rem' }}
                                                            >
                                                                <span className='visually-hidden'>Loading...</span>
                                                            </Spinner>
                                                        </div>
                                                    )}
                                                    {!deletionStarted && (
                                                        <div className='d-flex justify-content-center align-item-center'>
                                                            <Button
                                                                className='mt-3'
                                                                onClick={handleDeleteAccount}
                                                                disabled={!isPinComplete}
                                                                variant='danger'
                                                            >
                                                                Delete Account
                                                            </Button>
                                                        </div>
                                                    )}
                                                    {status && (
                                                        <p className='text-success mt-3 text-center'>{status}</p>
                                                    )}
                                                   
                                                </Row>
                                            </Accordion.Body>
                                        </Accordion.Item>
                                    </Accordion>
                                </div>
                            </div>
                        </Offcanvas.Body>
                    </Offcanvas>
                )}
            </div>
            <AddCryptoCard
                state={openAddCardModal}
                close={() => {
                    setOpenAddCardModal(false);
                    sessionStorage.removeItem('allCards');
                    window.location.reload();
                }}
            />
             <RetrieveCryptoCard
                state={openRetrieveModal}
                close={() => {
                    setOpenRetrieveModal(false);
                    sessionStorage.removeItem('allCards');
                    window.location.reload();
                }}
            />
        </div>
    );
}

export default CryptoCards;

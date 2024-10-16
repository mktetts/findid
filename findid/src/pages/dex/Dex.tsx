import React, { useEffect, useRef, useState } from 'react';
import {
    Card,
    Col,
    Container,
    Row,
    Table,
    Modal,
    Button,
    Form,
    InputGroup,
    Accordion,
    DropdownButton,
    Dropdown,
    Spinner
} from 'react-bootstrap';
import {
    APT_PRICE_IDENTIFIER,
    BTC_PRICE_IDENTIFIER,
    COINS_DECIMALS_AND_IDENTIFIER,
    DAI_PRICE_IDENTIFIER,
    ETH_PRICE_IDENTIFIER,
    USDC_PRICE_IDENTIFIER,
    USDT_PRICE_IDENTIFIER
} from '@/constants';
import { AptosPriceServiceConnection } from '@pythnetwork/pyth-aptos-js';
import { Price, PriceFeed } from '@pythnetwork/pyth-common-js';
import { coinImages } from '@/helpers/coinImages';
import { getRewardPool, getStakePool } from './view-functions/getStakePool';
import { BiChevronDown, BiDownArrowCircle, BiUpArrowCircle } from 'react-icons/bi';
import useWeb5InstanceStore from '@/store/web5Store';
import FinDIDSDK from '@/sdk';
import Loader from '@/components/Loader';
import { getAccountCoinsData, getAccountRawCoinsData } from '@/blockchain/view-functions/getAccountCoins';
import { images } from '@/helpers/images';
import { FaAddressCard, FaLeaf } from 'react-icons/fa6';
import {
    excecuteAddLiquidityTransaction,
    excecuteAssRewardAsLiquidityTransaction,
    excecuteSwapTransaction,
    excecuteWithdrawLiquidityTransaction,
    excecuteWithdrawRewardTransaction
} from '@/blockchain/utils/signTransaction';
import { KeyManager } from '@/blockchain/utils/keyManagement';

interface PriceData {
    price: number;
    expo: number;
    publishTime: number;
}

function Dex() {
    const FEES = 0.03;
    const TESTNET_HERMES_ENDPOINT = 'https://hermes-beta.pyth.network';
    const { getWeb5 } = useWeb5InstanceStore();
    const testnetConnection = new AptosPriceServiceConnection(TESTNET_HERMES_ENDPOINT);
    const [prices, setPrices] = useState({});
    const [stakePool, setStakePool] = useState([]);
    const [rewardPool, setRewardPool] = useState([]);
    const [refreshCountdown, setRefreshCountdown] = useState(10);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [activeTokenSelect, setActiveTokenSelect] = useState(null);
    const [fromToken, setFromToken] = useState({ name: '', image: '' });
    const [toToken, setToToken] = useState({ name: '', image: '' });
    const [chekingToken, setCheckingToken] = useState({ name: '', image: '' });
    const [checkingTokenBalance, setCheckingTokenBalance] = useState(0);
    const [conversionRate, setConversionRate] = useState(null);
    const [fromAmount, setFromAmount] = useState('');
    const [toAmount, setToAmount] = useState('');
    const [fromAmountPay, setFromAmountPay] = useState('');
    const [connectedDid, setConnectedDid] = useState('');
    const [allCards, setAllCards] = useState([]);
    const [errorMessage, setErrorMessage] = useState('');
    const [allCoins, setAllCoins] = useState([]);
    const [currentAccount, setCurrentAccount] = useState(null);
    const [liquidityAmount, setLiquidityAmount] = useState('');
    const [rewardAmount, setRewardAmount] = useState('');
    const [openAddLiquidityModal, setOpenAddLiquidityModal] = useState(false);
    const [openWithdrawLiquidityModal, setOpenWithdrawLiquidityModal] = useState(false);
    const [openGetRewardModal, setOpengetRewardModal] = useState(false);
    const [openAddRewardAsLiquidityModal, setOpenAddRewardAsLiquidityModal] = useState(false);
    const [openSwapModal, setOpenSwapModal] = useState(false);
    const [pin, setPin] = useState(['', '', '', '']);
    const [showPin, setShowPin] = useState(false);
    const inputRefs = useRef([]);
    const [transactionStarted, setTransactionStarted] = useState(false);
    const [transactionHash, setTransactionHash] = useState('');
    const [myLiquidity, setMyLiquidity] = useState(0);
    const [myReward, setMyReward] = useState(0);
    const [numberError, setNumberError] = useState('');

    useEffect(() => {
        const countdownInterval = setInterval(() => {
            setRefreshCountdown((prev) => {
                if (prev <= 1) {
                    init();
                    return 10;
                }
                return prev - 1;
            });
        }, 1000);
        getNeededData();

        // return () => clearInterval(countdownInterval);
    }, []);

    const handleTokenClick = tokenType => {
        setActiveTokenSelect(tokenType);
        setShowModal(true);
    };

    const selectToken = (name, image) => {
        if (activeTokenSelect === 'from') {
            setFromToken({ name, image });
            handleConversion(name, toToken.name, fromAmount);
        } else if (activeTokenSelect === 'to') {
            setToToken({ name, image });
            handleConversion(fromToken.name, name, fromAmount);
        } else {
            setCheckingToken({ name, image });
            const coin = allCoins.find(coin => coin.symbol === name);
            if (coin) {
                setCheckingTokenBalance(coin.amount);
            } else {
                setCheckingTokenBalance(0);
            }
            const myLiquidity = stakePool
                .find(coin => coin.key === name)
                ?.value.stakers.data.find(staker => staker.key === '0x' + currentAccount.address)?.value;
            setMyLiquidity(myLiquidity === undefined ? 0 : myLiquidity / Math.pow(10, coin.decimal));

            const myReward = rewardPool
                .find(coin => coin.key === name)
                ?.value.rewards.data.find(staker => staker?.key === '0x' + currentAccount.address)?.value;
            setMyReward(myReward === undefined ? 0 : myReward / Math.pow(10, coin.decimal));
        }
        setShowModal(false);
    };
    const getNeededData = async () => {
        try {
            let allCards = sessionStorage.getItem('allCards');
            let allCoins;
            let current_account = '';
            if (!allCards) {
                const cards = await FinDIDSDK.getCryptoCards(await getWeb5(), connectedDid);
                setAllCards(cards);
                setCurrentAccount(cards[0]);
                const allCoins = await getAccountCoinsData(cards[0].address);
                current_account = cards[0].address;
                setAllCoins(allCoins);
                sessionStorage.setItem('allCards', JSON.stringify(cards));
            } else {
                let cards = JSON.parse(allCards);
                setAllCards(cards);
                setCurrentAccount(cards[0]);
                current_account = cards[0].address;
                allCoins = await getAccountCoinsData(cards[0].address);
                setAllCoins(allCoins);
            }
            const stakePools = (await getStakePool()) as any;
            const rewardPools = (await getRewardPool()) as any;
            setStakePool(stakePools.stake_pool.data);
            setRewardPool(rewardPools.reward_pool.data);
            let data = stakePools.stake_pool.data;
            setCheckingToken({
                name: data[0].key,
                image: coinImages[data[0].key]
            });
            const myLiquidity = data
                .find(coin => coin.key === data[0].key)
                ?.value.stakers.data.find(staker => staker.key === '0x' + current_account)?.value;

            const myReward = rewardPools.reward_pool.data
                .find(coin => coin.key === data[0].key)
                ?.value.rewards.data.find(staker => staker?.key === '0x' + current_account)?.value;

            const coin = allCoins.find(coin => coin.symbol === data[0].key);
            if (coin) {
                setCheckingTokenBalance(coin.amount);
            } else {
                setCheckingTokenBalance(0);
            }
            setMyLiquidity(myLiquidity === undefined ? 0 : myLiquidity / Math.pow(10, coin.decimal));
            setMyReward(myReward === undefined ? 0 : myReward / Math.pow(10, coin.decimal));
            setFromToken({
                name: data[0].key,
                image: coinImages[data[0].key]
            });
            setToToken({
                name: data[1].key,
                image: coinImages[data[1].key]
            });
            setLoading(false);
        } catch (e) {
            setErrorMessage(e.message);
        }
    };
    const init = async () => {
        const [APT, BTC, DAI, ETH, USDC, USDT] = await testnetConnection.getLatestPriceFeeds([
            APT_PRICE_IDENTIFIER,
            BTC_PRICE_IDENTIFIER,
            DAI_PRICE_IDENTIFIER,
            ETH_PRICE_IDENTIFIER,
            USDC_PRICE_IDENTIFIER,
            USDT_PRICE_IDENTIFIER
        ]);
        setPrices({
            APT: APT.getPriceUnchecked(),
            BTC: BTC.getPriceUnchecked(),
            DAI: DAI.getPriceUnchecked(),
            ETH: ETH.getPriceUnchecked(),
            USDC: USDC.getPriceUnchecked(),
            USDT: USDT.getPriceUnchecked()
        });
    };
    const formatPrice = (price, expo) => {
        return (price * Math.pow(10, expo)).toFixed(8);
    };

    const formatDate = timestamp => {
        const date = new Date(timestamp * 1000);
        return date.toLocaleString();
    };

    const handleConversion = async (fromTokenName, toTokenName, amount) => {
        if (amount && fromTokenName !== toTokenName) {
            const fromTokenPrice = parseFloat(formatPrice(prices[fromTokenName].price, prices[fromTokenName].expo));
            const toTokenPrice = parseFloat(prices[toTokenName].price) * Math.pow(10, prices[toTokenName].expo);
            let toAmount = parseFloat(((amount * fromTokenPrice) / toTokenPrice).toFixed(6));
            setToAmount(toAmount.toString());
            let baseFromAmountNeeded = toAmount * (1 / fromTokenPrice);
            let amountToPay = baseFromAmountNeeded + toAmount * (1 / fromTokenPrice) * FEES;
            setFromAmountPay(amountToPay.toFixed(6));
        } else {
            setToAmount('');
            setFromAmountPay('');
        }
    };
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
    const isPinComplete = pin.every(digit => digit !== '');

    const handleAddLiquidity = async () => {
        try {
            let rawCoinData = await getAccountRawCoinsData(currentAccount.address);
            const coin = rawCoinData.find(coin => coin.metadata.symbol === chekingToken.name);
            let coinType = coin.asset_type;
            const transactionData = {
                amount: parseFloat(liquidityAmount) * Math.pow(10, coin.metadata.decimals),
                typeArguments: [coinType]
            };
            setOpenAddLiquidityModal(true);
            setTransactionStarted(true);
            const res = await excecuteAddLiquidityTransaction(currentAccount, pin, transactionData);
            if (res.success) {
                setTransactionHash(res.hash);
                setTransactionStarted(false);
            }
        } catch (e) {
            setTransactionStarted(false);
            setErrorMessage(e.message);
        }
    };
    const handleSwap = async () => {
        try {
            const connection = new AptosPriceServiceConnection(TESTNET_HERMES_ENDPOINT);

            const priceFeedUpdateData = await connection.getPriceFeedsUpdateData([
                COINS_DECIMALS_AND_IDENTIFIER[fromToken.name].price_identifier,
                COINS_DECIMALS_AND_IDENTIFIER[toToken.name].price_identifier
            ]);
            const transactionData = {
                amount: parseFloat(toAmount) * Math.pow(10, COINS_DECIMALS_AND_IDENTIFIER[toToken.name].decimal),
                price_update_data: priceFeedUpdateData,
                typeArguments: [
                    COINS_DECIMALS_AND_IDENTIFIER[fromToken.name].asset_type,
                    COINS_DECIMALS_AND_IDENTIFIER[toToken.name].asset_type
                ]
            };
            setOpenSwapModal(true);
            setTransactionStarted(true);
            const res = await excecuteSwapTransaction(currentAccount, pin, transactionData);
            if (res.success) {
                setTransactionHash(res.hash);
                setTransactionStarted(false);
            }
        } catch (e) {
            setTransactionStarted(false);
            setErrorMessage(e.message);
        }
    };
    const handleWithdrawLiquidity = async () => {
        try {
            let rawCoinData = await getAccountRawCoinsData(currentAccount.address);
            const coin = rawCoinData.find(coin => coin.metadata.symbol === chekingToken.name);
            let coinType = coin.asset_type;
            const transactionData = {
                amount: parseFloat(liquidityAmount) * Math.pow(10, coin.metadata.decimals),
                typeArguments: [coinType]
            };
            setTransactionStarted(true);
            const res = await excecuteWithdrawLiquidityTransaction(currentAccount, pin, transactionData);
            if (res.success) {
                setTransactionHash(res.hash);
                setTransactionStarted(false);
            }
        } catch (e) {
            setTransactionStarted(false);
            setErrorMessage(e.message);
        }
    };
    const handleWithdrawReward = async () => {
        try {
            let rawCoinData = await getAccountRawCoinsData(currentAccount.address);
            const coin = rawCoinData.find(coin => coin.metadata.symbol === chekingToken.name);
            let coinType = coin.asset_type;
            const transactionData = {
                amount: parseFloat(rewardAmount) * Math.pow(10, coin.metadata.decimals),
                typeArguments: [coinType]
            };
            setTransactionStarted(true);
            const res = await excecuteWithdrawRewardTransaction(currentAccount, pin, transactionData);
            if (res.success) {
                setTransactionHash(res.hash);
                setTransactionStarted(false);
            }
        } catch (e) {
            setTransactionStarted(false);
            setErrorMessage(e.message);
        }
    };
    const handleAddRewardAsLiquidity = async () => {
        try {
            let rawCoinData = await getAccountRawCoinsData(currentAccount.address);
            const coin = rawCoinData.find(coin => coin.metadata.symbol === chekingToken.name);
            let coinType = coin.asset_type;

            const transactionData = {
                amount: BigInt(
                    Math.round(parseFloat(rewardAmount) * Math.pow(10, coin.metadata.decimals))
                ),
                typeArguments: [coinType]
            };
            setTransactionStarted(true);
            const res = await excecuteAssRewardAsLiquidityTransaction(currentAccount, pin, transactionData);
            if (res.success) {
                setTransactionHash(res.hash);
                setTransactionStarted(false);
            }
        } catch (e) {
            setTransactionStarted(false);
            setErrorMessage(e.message);
        }
    };
    const handleOpenAddLiquidityModal = () => {
        if (checkingTokenBalance < parseFloat(liquidityAmount)) {
            setNumberError('Error: Amount is greater than in your wallet');
            return;
        }
        setNumberError('');
        setOpenAddLiquidityModal(true);
    };
    const handleOpenWithDrawLiquidityModal = () => {
        if (myLiquidity < parseFloat(liquidityAmount)) {
            setNumberError('Error: Amount is greater than in your available liquidity');
            return;
        }
        setNumberError('');
        setOpenWithdrawLiquidityModal(true);
    };
    const handleOpenWithdrawRewardModal = () => {
        if (myReward < parseFloat(rewardAmount)) {
            setNumberError('Error: Amount is greater than in your available reward');
            return;
        }
        setNumberError('');
        setOpengetRewardModal(true);
    };
    const handleOpenWithAddRewardAsLiquidityModal = () => {
        if (myReward < parseFloat(rewardAmount)) {
            setNumberError('Error: Amount is greater than in your available reward');
            return;
        }
        setNumberError('');
        setOpenAddRewardAsLiquidityModal(true);
    };
    if (loading) {
        return <Loader />;
    }
    return (
        <div>
            <div className='d-flex justify-content-between align-items-center mt-2'>
                <h3 className='flex-grow-1 text-center'>Welcome to ApDex</h3>
                <DropdownButton
                    align='end'
                    title={currentAccount.accountName}
                    id='dropdown-menu-align-end'
                    variant='secondary'
                    className='ms-auto'
                >
                    {allCards.map((card, index) => (
                        <Dropdown.Item key={index} eventKey={index} onChange={() => setCurrentAccount(card)}>
                            {card.accountName}
                        </Dropdown.Item>
                    ))}
                </DropdownButton>
            </div>
            <Container className='carousel-container mt-5 '>
                <Row className='d-flex'>
                    {stakePool.length && (
                        <div className='d-flex card-row'>
                            {(stakePool as any).map((item, index) => {
                                const token = item.key;
                                const totalAmount =
                                    item.value.total_amount / Math.pow(10, COINS_DECIMALS_AND_IDENTIFIER[token].decimal);
                                const stakersCount = item.value.stakers.data.length;
                                const imageUrl = coinImages[token];
                                return (
                                    <Card className='token-card' key={index}>
                                        <div className='d-flex align-items-center'>
                                            <div className='icon-container'>
                                                <img src={imageUrl} alt={`${token} logo`} className='token-icon1' />
                                            </div>
                                            <div className='card-details'>
                                                <Card.Body>
                                                    <Card.Title>{token}</Card.Title>
                                                    <Card.Text>
                                                        <strong>Liquidity:</strong> {totalAmount} {token}
                                                    </Card.Text>
                                                    <Card.Text>
                                                        <strong>Unique Stakers:</strong> {stakersCount}
                                                    </Card.Text>
                                                </Card.Body>
                                            </div>
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </Row>
            </Container>
            <Container>
                <Row>
                    <Col className='d-flex justify-content-center align-item-center'>
                        <div className='swap-container'>
                            <div className='swap-header'>
                                <h5>Swap Tokens</h5>
                            </div>

                            <div className='token-select' onClick={() => handleTokenClick('from')}>
                                <div className='d-flex align-items-center'>
                                    <img src={fromToken.image} alt={fromToken.name} className='token-icon' />
                                    <span>{fromToken.name}</span>
                                </div>
                                <BiChevronDown />
                            </div>

                            <InputGroup className='mb-3'>
                                <Form.Control
                                    type='text'
                                    placeholder='0.0'
                                    className='token-amount'
                                    aria-label='From Token Amount'
                                    value={fromAmount}
                                    onChange={e => {
                                        setFromAmount(e.target.value);
                                        handleConversion(fromToken.name, toToken.name, parseFloat(e.target.value));
                                    }}
                                />
                            </InputGroup>

                            <div className='swap-icon text-center'>
                                <BiDownArrowCircle className='arrow-icon' />
                            </div>

                            <div className='token-select' onClick={() => handleTokenClick('to')}>
                                <div className='d-flex align-items-center'>
                                    <img src={toToken.image} alt={toToken.name} className='token-icon' />
                                    <span>{toToken.name}</span>
                                </div>
                                <BiChevronDown />
                            </div>

                            <InputGroup className='mb-3'>
                                <Form.Control
                                    type='number'
                                    placeholder='0.0'
                                    className='token-amount'
                                    aria-label='To Token Amount'
                                    disabled
                                    value={toAmount || 0}
                                />
                            </InputGroup>

                            <Button
                                className='swap-button'
                                variant='success'
                                disabled={fromToken.name === toToken.name}
                                onClick={() => setOpenSwapModal(true)}
                            >
                                {fromAmountPay && (
                                    <>
                                        Pay {fromAmountPay} {fromToken.name} to{' '}
                                    </>
                                )}
                                Swap
                            </Button>
                            {toAmount && (
                                <div className='ms-3 mt-3'>
                                    <li>
                                        You will get{' '}
                                        <span className='text-primary'>
                                            {toAmount} {toToken.name}
                                        </span>{' '}
                                        Apprx.
                                    </li>
                                    <li>
                                        <span className='text-primary'>3 %</span> fee included
                                    </li>
                                    <li>
                                        <span className='text-primary'> {'< 0.00000002'} APT </span> for onchain price updates
                                    </li>
                                </div>
                            )}
                            {/* Token Selection Modal */}
                            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                                <Modal.Header closeButton>
                                    <Modal.Title>Select a Token</Modal.Title>
                                </Modal.Header>
                                <Modal.Body>
                                    <ul className='token-list'>
                                        {(stakePool as any).map((item, index) => {
                                            const token = item.key;
                                            const imageUrl = coinImages[token];

                                            return (
                                                <li key={index} onClick={() => selectToken(token, imageUrl)}>
                                                    <img src={imageUrl} alt={token} /> {token}
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </Modal.Body>
                            </Modal>
                        </div>
                    </Col>
                    <Col xs={7}>
                        <div className='token-select1' onClick={() => handleTokenClick('checking')}>
                            <div className='d-flex align-items-center justify-content-center'>
                                <img src={chekingToken.image} alt={chekingToken.name} className='token-icon' />
                                <span>{chekingToken.name} - Currently Selected Token</span>
                            </div>
                            <BiChevronDown />
                        </div>
                        <Accordion defaultActiveKey='0'>
                            <Accordion.Item eventKey='0'>
                                <Accordion.Header>Liquidity Pool</Accordion.Header>
                                <Accordion.Body>
                                    <Row>
                                        <div className='col-5 d-flex flex-column justify-content-center align-items-center mb-5 mt-5'>
                                            <img src={chekingToken.image} width={80} height={80} />
                                            <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                                                {myLiquidity} {chekingToken.name}
                                            </p>
                                        </div>
                                        {/* Column for Input and Button */}
                                        <div className='col-7 d-flex flex-column justify-content-center align-items-center'>
                                            <div className='mb-2'>
                                                You have {checkingTokenBalance} {chekingToken.name} in Wallet
                                            </div>
                                            <input
                                                type='text'
                                                className='form-control mb-3'
                                                placeholder='Enter amount'
                                                value={liquidityAmount}
                                                onChange={e => setLiquidityAmount(e.target.value)}
                                                style={{ maxWidth: '320px' }}
                                            />
                                            {/* {checkingTokenBalance < parseFloat(liquidityAmount) && (
                                                <span className='text-danger mb-3'>*Amount is greater than your balance</span>
                                            )} */}
                                            {numberError && <span className='text-danger mb-3'>{numberError}</span>}
                                            <div className='d-flex'>
                                                <Button
                                                    className='btn btn-primary'
                                                    variant='danger'
                                                    disabled={!liquidityAmount}
                                                    onClick={handleOpenWithDrawLiquidityModal}
                                                >
                                                    Withdraw
                                                </Button>
                                                <Button
                                                    className='btn  ms-3'
                                                    variant='success'
                                                    disabled={!liquidityAmount}
                                                    // disabled={
                                                    //     !liquidityAmount || checkingTokenBalance < parseFloat(liquidityAmount)
                                                    // }
                                                    onClick={handleOpenAddLiquidityModal}
                                                >
                                                    Add Liquidity
                                                </Button>
                                            </div>
                                        </div>
                                    </Row>
                                </Accordion.Body>
                            </Accordion.Item>
                            <Accordion.Item eventKey='1'>
                                <Accordion.Header>Reward Pool</Accordion.Header>
                                <Accordion.Body>
                                    <Row>
                                        <div className='col-5 d-flex flex-column justify-content-center align-items-center mb-5 mt-5'>
                                            <img src={chekingToken.image} width={80} height={80} />
                                            <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                                                {myReward} {chekingToken.name}
                                            </p>
                                        </div>
                                        {/* Column for Input and Button */}
                                        <div className='col-7 d-flex flex-column justify-content-center align-items-center'>
                                            <input
                                                type='text'
                                                className='form-control mb-3'
                                                value={rewardAmount}
                                                placeholder='Enter amount'
                                                style={{ maxWidth: '320px' }}
                                                onChange={e => setRewardAmount(e.target.value)}
                                            />
                                            <div className='d-flex'>
                                                <Button
                                                    className='btn btn-primary'
                                                    variant='danger'
                                                    disabled={!rewardAmount}
                                                    onClick={handleOpenWithdrawRewardModal}
                                                >
                                                    Withdraw
                                                </Button>
                                                <Button
                                                    className='btn btn-primary ms-3'
                                                    variant='success'
                                                    onClick={handleOpenWithAddRewardAsLiquidityModal}
                                                    disabled={!rewardAmount}
                                                >
                                                    Add Liquidity
                                                </Button>
                                            </div>
                                        </div>
                                    </Row>
                                </Accordion.Body>
                            </Accordion.Item>
                        </Accordion>
                    </Col>
                </Row>
            </Container>

            <Container>
                <h5 className='mb-1 mt-5'>Current Crypto Prices:-</h5>
                <div className='float-end mb-3'>
                    <span className='badge bg-secondary'>Refreshing in {refreshCountdown} seconds</span>
                </div>
                <Table striped bordered hover>
                    <thead>
                        <tr>
                            <th className='text-center'>Coin Name</th>
                            <th className='text-center'>Price (USD)</th>
                            <th className='text-center'>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.keys(prices).length > 0 ? (
                            Object.entries(prices).map(([coin, priceData], index) => (
                                <tr key={index}>
                                    <td className='text-center'>
                                        <img src={coinImages[coin]} width={30} height={30} className='me-2' />
                                        {coin}
                                    </td>
                                    <td className='text-center'>
                                        {formatPrice((priceData as Price).price, (priceData as Price).expo)}
                                    </td>
                                    <td className='text-center'>{formatDate((priceData as Price).publishTime)}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={3} className='text-center'>
                                    Loading...
                                </td>
                            </tr>
                        )}
                    </tbody>
                </Table>
            </Container>

            <Modal
                show={openAddLiquidityModal}
                onHide={() => {
                    setOpenAddLiquidityModal(false), window.location.reload();
                }}
                backdrop='static'
                keyboard={false}
            >
                <Modal.Header closeButton>
                    <Modal.Title>Add Liquidity</Modal.Title>
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

                    {transactionStarted && (
                        <div className='d-flex justify-content-center align-items-center mt-3'>
                            <Spinner animation='border' role='status' variant='primary' style={{ width: '2rem', height: '2rem' }}>
                                <span className='visually-hidden'>Loading...</span>
                            </Spinner>
                        </div>
                    )}
                    {transactionHash && (
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
                            <h3 className='mt-3 fs-5'>Liquidity Added</h3>
                        </div>
                    )}
                    {transactionHash === '' && !transactionStarted && errorMessage && (
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
                            <h3 className='mt-3 fs-5 ms-2'>{errorMessage}</h3>
                        </div>
                    )}
                    {/* {errorMessage && (
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
                    )} */}
                </Modal.Body>
                <Modal.Footer>
                    {!transactionStarted && !transactionHash && (
                        <Button variant='secondary' onClick={handleAddLiquidity} disabled={!isPinComplete}>
                            <span className='ms-2'>Add Liquidity</span>
                        </Button>
                    )}
                </Modal.Footer>
            </Modal>

            <Modal
                show={openSwapModal}
                onHide={() => {
                    setOpenSwapModal(false), window.location.reload();
                }}
                backdrop='static'
                keyboard={false}
            >
                <Modal.Header closeButton>
                    <Modal.Title>Swap</Modal.Title>
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

                    {transactionStarted && (
                        <div className='d-flex justify-content-center align-items-center mt-3'>
                            <Spinner animation='border' role='status' variant='primary' style={{ width: '2rem', height: '2rem' }}>
                                <span className='visually-hidden'>Loading...</span>
                            </Spinner>
                        </div>
                    )}
                    {transactionHash && (
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
                            <h3 className='mt-3 fs-5'>Successfully Swapped</h3>
                        </div>
                    )}
                    {transactionHash === '' && !transactionStarted && errorMessage && (
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
                            <h3 className='mt-3 fs-5 ms-2'>{errorMessage}</h3>
                        </div>
                    )}
                    {/* {errorMessage && (
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
                    )} */}
                </Modal.Body>
                <Modal.Footer>
                    {!transactionStarted && !transactionHash && (
                        <Button variant='secondary' onClick={handleSwap} disabled={!isPinComplete}>
                            <span className='ms-2'>Swap</span>
                        </Button>
                    )}
                </Modal.Footer>
            </Modal>

            <Modal
                show={openWithdrawLiquidityModal}
                onHide={() => {
                    setOpenWithdrawLiquidityModal(false), window.location.reload();
                }}
                backdrop='static'
                keyboard={false}
            >
                <Modal.Header closeButton>
                    <Modal.Title>Withdraw Liquidity</Modal.Title>
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

                    {transactionStarted && (
                        <div className='d-flex justify-content-center align-items-center mt-3'>
                            <Spinner animation='border' role='status' variant='primary' style={{ width: '2rem', height: '2rem' }}>
                                <span className='visually-hidden'>Loading...</span>
                            </Spinner>
                        </div>
                    )}
                    {transactionHash && (
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
                            <h3 className='mt-3 fs-5'>Liquidity Withdrawn</h3>
                        </div>
                    )}
                    {transactionHash === '' && !transactionStarted && errorMessage && (
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
                            <h3 className='mt-3 fs-5 ms-2'>{errorMessage}</h3>
                        </div>
                    )}
                    {/* {errorMessage && (
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
                    )} */}
                </Modal.Body>
                <Modal.Footer>
                    {!transactionStarted && !transactionHash && (
                        <Button variant='secondary' onClick={handleWithdrawLiquidity} disabled={!isPinComplete}>
                            <span className='ms-2'>Withdraw Liquidity</span>
                        </Button>
                    )}
                </Modal.Footer>
            </Modal>

            <Modal
                show={openGetRewardModal}
                onHide={() => {
                    setOpengetRewardModal(false), window.location.reload();
                }}
                backdrop='static'
                keyboard={false}
            >
                <Modal.Header closeButton>
                    <Modal.Title>Withdraw Reward</Modal.Title>
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

                    {transactionStarted && (
                        <div className='d-flex justify-content-center align-items-center mt-3'>
                            <Spinner animation='border' role='status' variant='primary' style={{ width: '2rem', height: '2rem' }}>
                                <span className='visually-hidden'>Loading...</span>
                            </Spinner>
                        </div>
                    )}
                    {transactionHash && (
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
                            <h3 className='mt-3 fs-5'>Reward Withdrawn</h3>
                        </div>
                    )}
                    {transactionHash === '' && !transactionStarted && errorMessage && (
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
                            <h3 className='mt-3 fs-5 ms-2'>{errorMessage}</h3>
                        </div>
                    )}
                    {/* {errorMessage && (
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
                    )} */}
                </Modal.Body>
                <Modal.Footer>
                    {!transactionStarted && !transactionHash && (
                        <Button variant='secondary' onClick={handleWithdrawReward} disabled={!isPinComplete}>
                            <span className='ms-2'>Withdraw Reward</span>
                        </Button>
                    )}
                </Modal.Footer>
            </Modal>

            <Modal
                show={openAddRewardAsLiquidityModal}
                onHide={() => {
                    setOpenAddRewardAsLiquidityModal(false), window.location.reload();
                }}
                backdrop='static'
                keyboard={false}
            >
                <Modal.Header closeButton>
                    <Modal.Title>Add Reward as Liquidity</Modal.Title>
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

                    {transactionStarted && (
                        <div className='d-flex justify-content-center align-items-center mt-3'>
                            <Spinner animation='border' role='status' variant='primary' style={{ width: '2rem', height: '2rem' }}>
                                <span className='visually-hidden'>Loading...</span>
                            </Spinner>
                        </div>
                    )}
                    {transactionHash && (
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
                            <h3 className='mt-3 fs-5'>Added Reward as Liquidity </h3>
                        </div>
                    )}
                    {transactionHash === '' && !transactionStarted && errorMessage && (
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
                            <h3 className='mt-3 fs-5 ms-2'>{errorMessage}</h3>
                        </div>
                    )}
                    {/* {errorMessage && (
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
                    )} */}
                </Modal.Body>
                <Modal.Footer>
                    {!transactionStarted && !transactionHash && (
                        <Button variant='secondary' onClick={handleAddRewardAsLiquidity} disabled={!isPinComplete}>
                            <span className='ms-2'>Add Reward as Liquidity</span>
                        </Button>
                    )}
                </Modal.Footer>
            </Modal>
        </div>
    );
}

export default Dex;

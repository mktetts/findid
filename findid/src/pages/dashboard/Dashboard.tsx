import { getAccountTransactions } from '@/blockchain/view-functions/getAccountTransaction';
import Loader from '@/components/Loader';
import { NETWORK } from '@/constants';
import FinDIDSDK from '@/sdk';
import DataTable, { createTheme } from 'react-data-table-component';
import useWeb5InstanceStore from '@/store/web5Store';
import React, { useEffect, useState } from 'react';
import {
    Card,
    Row,
    Col,
    Button,
    Tabs,
    Tab,
    Pagination,
    Table,
    Form,
    DropdownButton,
    Dropdown,
    ListGroup,
    Image,
    InputGroup
} from 'react-bootstrap';
import { FaEnvelope, FaUser } from 'react-icons/fa';
import { FaCheck, FaCopy, FaLink } from 'react-icons/fa6';
import { FiCheck, FiCopy } from 'react-icons/fi';

function Dashboard({ identity }) {
    const [connectedDid, setConnectedDid] = useState('');
    const { getWeb5 } = useWeb5InstanceStore();
    const [allCards, setAllCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentAccount, setCurrentAccount] = useState(null);
    const [isCopied, setIsCopied] = useState(false);
    const [allTransaction, setAllTransaction] = useState([]);
    const [copiedHash, setCopiedHash] = useState(null);
    const [sentPaymentDetails, setSentPaymentDetils] = useState([]);
    const [receivedPaymentDetails, setReceivedPaymentDetils] = useState([]);
    const [allContacts, setAllContacts] = useState([]);
    // Columns definition for the DataTable
    const columns = [
        { name: 'Sender', selector: row => row.sender, sortable: true },
        { name: 'Receiver', selector: row => row.receiver, sortable: true },
        { name: 'Amount', selector: row => row.amount, sortable: true },
        { name: 'Token', selector: row => row.token, sortable: true },
        {
            name: 'Notes',
            selector: row => row.notes,
            cell: row => <TruncatedNotes notes={row.notes} />, // Use the custom component for notes
            grow: 2 // Allow the column to grow more
        },
        { name: 'Timestamp', selector: row => row.timestamp, sortable: true }
    ];

    const [searchTerm, setSearchTerm] = useState('');

    const filteredSentPaymentsPayments = sentPaymentDetails.filter(
        payment =>
            payment.sender.toLowerCase().includes(searchTerm.toLowerCase()) ||
            payment.receiver.toLowerCase().includes(searchTerm.toLowerCase()) ||
            payment.token.toLowerCase().includes(searchTerm.toLowerCase()) ||
            payment.notes.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const filteredReceivedPaymentsPayments = receivedPaymentDetails.filter(
        payment =>
            payment.sender.toLowerCase().includes(searchTerm.toLowerCase()) ||
            payment.receiver.toLowerCase().includes(searchTerm.toLowerCase()) ||
            payment.token.toLowerCase().includes(searchTerm.toLowerCase()) ||
            payment.notes.toLowerCase().includes(searchTerm.toLowerCase())
    );
    useEffect(() => {
        let connectedDid = sessionStorage.getItem('connectedDid');
        setConnectedDid(connectedDid);
        init();
    }, []);

    const init = async () => {
        let allCards = sessionStorage.getItem('allCards');
        let current_account;
        if (!allCards) {
            const cards = await FinDIDSDK.getCryptoCards(await getWeb5(), connectedDid);
            setAllCards(cards);
            setCurrentAccount(cards[0]);
            if(cards.length === 0){
                current_account = null
            }
            else{
                current_account = cards[0];
                sessionStorage.setItem('allCards', JSON.stringify(cards));
            }
        } else {
            let cards = JSON.parse(allCards);
            setAllCards(cards);
            setCurrentAccount(cards[0]);
            current_account = cards[0];
        }
        if(current_account === null){
            setLoading(false);
            return
        }
        const transactions = await getAccountTransactions(current_account.address);

        setAllTransaction(transactions);
        let details = await FinDIDSDK.getPaymentDetails(await getWeb5(), current_account.address);
        setSentPaymentDetils(details.sendPaymentDetails);
        setReceivedPaymentDetils(details.receivedPaymentDetails);
        const contacts = await FinDIDSDK.getContacts(await getWeb5(), connectedDid);
        setAllContacts(contacts);
        
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
    const formatString = (str: string) => {
        if (str.length <= 20) {
            return str;
        }
        return str.slice(0, 10) + '***' + str.slice(-10);
    };

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [searchQuery, setSearchQuery] = useState('');
    // Convert timestamp from microseconds to milliseconds and format it
    const formatTimestamp = timestamp => {
        const date = new Date(parseInt(timestamp) / 1000);
        return date.toLocaleString();
    };

    // Handle search input
    const handleSearch = event => {
        setSearchQuery(event.target.value);
        setCurrentPage(1); // Reset to first page after search
    };
    const sortedTransactions = [...allTransaction].sort((a, b) => b.timestamp - a.timestamp);

    // Filter transactions by hash
    const filteredTransactions = sortedTransactions.filter(tx => tx.hash.toLowerCase().includes(searchQuery.toLowerCase()));

    // Get current transactions
    const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentTransactions = filteredTransactions.slice(indexOfFirstItem, indexOfLastItem);

    // Change page
    const paginate = pageNumber => setCurrentPage(pageNumber);

    // Pagination items
    const paginationItems = [];
    for (let number = 1; number <= totalPages; number++) {
        paginationItems.push(
            <Pagination.Item key={number} active={number === currentPage} onClick={() => paginate(number)}>
                {number}
            </Pagination.Item>
        );
    }
    const copyToClipboard = hash => {
        navigator.clipboard.writeText(hash);
        setCopiedHash(hash);
        setTimeout(() => setCopiedHash(null), 2000); // Revert back to the copy icon after 2 seconds
    };

    const handleChangeCurrentAccount = async account => {
        setCurrentAccount(account);
        const transactions = await getAccountTransactions(account.address);
        let details = await FinDIDSDK.getPaymentDetails(await getWeb5(), account.address);
        setSentPaymentDetils(details.sendPaymentDetails);
        setReceivedPaymentDetils(details.receivedPaymentDetails);
        setAllTransaction(transactions);
    };
    if (loading) {
        return <Loader />;
    }
    createTheme('dark', {
        background: {
            default: 'transparent'
        }
    });
    return (
        <div>
            <div className='d-flex justify-content-between align-items-center mt-2'>
                {/* <h3 className='flex-grow-1 text-center'>Welcome back, {identity.username}</h3> */}
                <DropdownButton
                    align='end'
                    title={currentAccount.accountName}
                    id='dropdown-menu-align-end'
                    variant='secondary'
                    className='ms-auto'
                >
                    {allCards.map((card, index) => (
                        <Dropdown.Item key={index} eventKey={index} onClick={() => handleChangeCurrentAccount(card)}>
                            {card.accountName}
                        </Dropdown.Item>
                    ))}
                </DropdownButton>
            </div>
            <div className='container mt-5 mb-5'>
                <div className='row no-gutters'>
                    <div className='col-md-4 col-lg-4'>
                        <img src={identity.profile} className='profile-image ' />
                    </div>
                    <div className='col-md-8 col-lg-8'>
                        <div className='d-flex flex-column'>
                            <div className=' flex-row justify-content-between align-items-center p-4 bg-dark text-white'>
                                <h2 className='display-5'>{identity.username}</h2>
                                <div className='d-flex'>
                                    <p className='mt-3'>Identity: {connectedDid} </p>
                                </div>
                                <p className='mt-3'>Email: {identity.email} </p>
                            </div>
                            <div className='p-3 bg-black text-white d-flex'>
                                <h6>Account : {formatString(currentAccount.address)}</h6>

                                {isCopied ? (
                                    <FiCheck className='ms-2 text-success' /> // Checkmark icon when copied
                                ) : (
                                    <FiCopy
                                        className='ms-2'
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => handleSCopy(currentAccount.address)}
                                    /> // Copy icon before it's copied
                                )}
                            </div>
                            <div className='d-flex flex-row text-white'>
                                <div className='p-4 bg-secondary text-center skill-block'>
                                    <h4>{allContacts.length}</h4>
                                    <h6>Contacts</h6>
                                </div>
                                <div className='p-3 bg-secondary text-center skill-block'>
                                    <h4>{allCards.length}</h4>
                                    <h6>Accounts</h6>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Tabs defaultActiveKey='home' id='uncontrolled-tab-example' className='mb-3' fill variant='pills'>
                <Tab eventKey='home' title='Your Transactions '>
                    <Form.Group className='mb-3'>
                        <Form.Control type='text' placeholder='Search by Hash' value={searchQuery} onChange={handleSearch} />
                    </Form.Group>
                    <Table striped bordered hover responsive>
                        <thead>
                            <tr>
                                <th>Version</th>
                                <th>Hash</th>
                                <th>Function</th>
                                <th>Gas Used</th>
                                <th>Success</th>
                                <th>VM Status</th>
                                <th>Timestamp</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentTransactions.map((tx, index) => (
                                <tr key={index}>
                                    <td>
                                        <a
                                            href={`https://explorer.aptoslabs.com/txn/${tx.version}?network=testnet`}
                                            target='_blank'
                                            rel='noopener noreferrer'
                                            title='View on Explorer'
                                            style={{ textDecoration: 'underline' }} // Keeps the default table styling
                                        >
                                            {tx.version}
                                            <FaLink className='ms-2' />
                                        </a>
                                    </td>
                                    <td>
                                        {formatString(tx.hash)}{' '}
                                        <Button
                                            variant='link'
                                            className='p-0 ms-2'
                                            onClick={() => copyToClipboard(tx.hash)}
                                            title='Copy Hash'
                                        >
                                            {copiedHash === tx.hash ? <FaCheck color='green' /> : <FaCopy />}
                                        </Button>
                                    </td>
                                    <td>{tx.payload.function.split('::')[1] + '::' + tx.payload.function.split('::')[2]}</td>
                                    <td>{tx.gas_used}</td>
                                    <td style={{ color: tx.success ? 'green' : 'red' }}>{tx.success ? 'Yes' : 'No'}</td>
                                    <td>{tx.vm_status}</td>
                                    <td>{formatTimestamp(tx.timestamp)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                    <Pagination className='justify-content-center'>{paginationItems}</Pagination>
                </Tab>
                <Tab eventKey='profile' title='Sent Payments Details'>
                    <InputGroup className='mb-3 mt-5'>
                        <Form.Control
                            type='text'
                            placeholder='Search by sender, token, or notes...'
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </InputGroup>

                    {/* Data Table */}
                    <DataTable
                        theme='dark'
                        title='Sent Payments'
                        columns={columns}
                        data={filteredSentPaymentsPayments}
                        pagination
                        defaultSortFieldId='timestamp'
                        defaultSortAsc={false}
                        striped
                        highlightOnHover
                        conditionalRowStyles={[
                          {
                              when: () => true, // Apply to all rows
                              style: {
                                  height: '60px', // Ensure the height matches the CSS class
                                  display: 'flex',
                                  alignItems: 'center'
                              }
                          }
                      ]}
                        persistTableHead
                    />
                </Tab>
                <Tab eventKey='profile1' title='Received Payments Details'>
                    <InputGroup className='mb-3 mt-5'>
                        <Form.Control
                            type='text'
                            placeholder='Search by sender, token, or notes...'
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </InputGroup>

                    {/* Data Table */}
                    <DataTable
                        theme='dark'
                        title='Received Payments'
                        columns={columns}
                        data={filteredReceivedPaymentsPayments}
                        pagination
                        defaultSortFieldId='timestamp'
                        defaultSortAsc={false}
                        striped
                        highlightOnHover
                        conditionalRowStyles={[
                          {
                              when: () => true, // Apply to all rows
                              style: {
                                  height: '60px', // Ensure the height matches the CSS class
                                  display: 'flex',
                                  alignItems: 'center'
                              }
                          }
                      ]}
                        persistTableHead
                    />
                </Tab>
            </Tabs>
        </div>
    );
}
const TruncatedNotes = ({ notes }) => {
    const [expanded, setExpanded] = useState(false);

    const toggleExpanded = () => setExpanded(!expanded);

    return (
        <div>
            <span>{expanded ? notes : `${notes.slice(0, 50)}...`}</span>
            {notes.length > 50 && (
                <Button variant='link' onClick={toggleExpanded} size='sm' style={{ fontSize: '10px' }}>
                    {expanded ? 'Show Less' : 'Show More'}
                </Button>
            )}
        </div>
    );
};
export default Dashboard;

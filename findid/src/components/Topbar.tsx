import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';
import { MdLogout, MdOutlineFileOpen } from 'react-icons/md';
import { Button, Image } from 'react-bootstrap';
import { images } from '@/helpers/images';
import { useEffect, useState } from 'react';
import { FiMenu } from 'react-icons/fi';
import { BiHome, BiCreditCard, BiDollarCircle, BiBarChart, BiBriefcaseAlt, BiExport } from 'react-icons/bi';
import ExportIdentity from './ExportIdentity';
import { FaExchangeAlt } from 'react-icons/fa';

// import ExportIdentity from './ExportIdentity';
const Topbar = ({ identity }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [openExportModal, setOpenExportModal] = useState(false);
    const [connectedDid, setConnectedDid] = useState('');
    const [isNavOpen, setIsNavOpen] = useState(false);

    useEffect(() => {
        init();
    }, []);
    const init = async () => {
        let connectedDid = sessionStorage.getItem('connectedDid');
        setConnectedDid(connectedDid);
    };

    const formatString = (str: string) => {
        if (str.length <= 20) {
            return str;
        }
        return str.slice(0, 10) + '...' + str.slice(-10);
    };

    const handleExportIdentity = () => {
        setOpenExportModal(true);
    };

    const toggleNavbar = () => {
        setIsNavOpen(!isNavOpen);
    };
    return (
        <>
            <div></div>
            <Navbar
                expand='lg'
                className='w-100 custom-navbar'
                bg='#b22222'
                style={{
                    paddingLeft: '30px',
                    paddingRight: '30px'
                }}
            >
                <Navbar.Brand style={{ color: 'inherit' }}>
                    <div className='d-flex align-items-center'>
                        <Image src={images.logo2} alt='Logo' width='200' height='50' className='me-2' />
                    </div>
                </Navbar.Brand>
                <Navbar.Toggle aria-controls='navbarScroll' onClick={toggleNavbar}>
                    <i className='icon text-primary'>
                        <FiMenu />
                    </i>
                </Navbar.Toggle>

                <Navbar.Collapse>
                    <Nav className='me-auto navbar-nav iq-main-menu d-none d-lg-flex'>
                        <Nav.Link
                            as={NavLink}
                            to='/main/dashboard'
                            className={` text-primary nav-item1 ${location.pathname === '/main/dashboard' ? 'active' : ''}`}
                        >
                            <i className='icon me-2 fs-5'>
                                <BiHome className='icon' />
                            </i>
                            Dashboard
                        </Nav.Link>
                        <Nav.Link
                            as={NavLink}
                            to='/main/payment'
                            className={`mx-2 text-primary nav-item1 ${location.pathname === '/main/payment' ? 'active' : ''}`}
                        >
                            <i className='icon me-2 fs-5'>
                                <BiDollarCircle className='icon' />
                            </i>
                            Payment
                        </Nav.Link>
                        <Nav.Link
                            as={NavLink}
                            to='/main/cards'
                            className={` mx-2 text-primary nav-item1 ${location.pathname === '/main/cards' ? 'active' : ''}`}
                        >
                            <i className='icon me-2 fs-5'>
                                <BiCreditCard className='icon' />
                            </i>
                            Crypto Cards
                        </Nav.Link>
                        <Nav.Link
                            as={NavLink}
                            to='/main/dex'
                            className={` mx-2 text-primary nav-item1 ${location.pathname === '/main/dex' ? 'active' : ''}`}
                        >
                            <i className='icon me-2 fs-5'>
                                < FaExchangeAlt className='icon' />
                            </i>
                            ApDex
                        </Nav.Link>
                    </Nav>

                    <div className='d-flex d-none d-lg-flex'>
                        <NavDropdown
                            title={
                                <div className='d-flex align-items-center d-none d-lg-flex'>
                                    <img
                                        src={identity.profile}
                                        alt='User'
                                        className='rounded-circle'
                                        style={{ width: '40px', height: '40px' }}
                                    />
                                    <div className='caption ms-2'>
                                        <h5 className='mb-0 caption-title '>{identity.identity_name}</h5>
                                        <p className='mb-0 caption-sub-title'>{formatString(connectedDid)}</p>
                                    </div>
                                </div>
                            }
                            id='navbarScrollingDropdown'
                            className='no-caret'
                        >
                            <h6 className='text-overflow m-3' style={{ color: 'inherit' }}>
                                Welcome !
                            </h6>
                            <NavDropdown.Item onClick={handleExportIdentity}>
                                <MdOutlineFileOpen className='me-1' /> <span>Export Identity</span>
                            </NavDropdown.Item>
                            <NavDropdown.Item as={Link} to='/'>
                                <MdLogout className='me-1' /> <span>Logout</span>
                            </NavDropdown.Item>
                        </NavDropdown>
                    </div>
                </Navbar.Collapse>
            </Navbar>
            {isNavOpen && (
                <div>
                    <div className={`sidebar sidebar-default d-lg-none ${isNavOpen ? 'sidebar' : ''} navs-rounded`}>
                        <div className='sidebar-header d-flex align-items-center justify-content-start'>
                            <img src={images.logo2} width={200} height={55} className='mt-2 ms-3' />
                        </div>

                        <Nav className='flex-column d-flex'>
                            <Nav.Link
                                as={Link}
                                to={'/main/dashboard'}
                                className={`nav-item ${location.pathname === '/main/dashboard' ? 'active' : ''}`}
                            >
                                <i className='icon me-2 fs-5'>
                                    <BiHome className='icon' />
                                </i>
                                <span className='item-name mt-1'>Dashboard</span>
                            </Nav.Link>

                            <Nav.Link
                                as={Link}
                                to={'/main/payment'}
                                className={`nav-item ${location.pathname === '/main/payment' ? 'active' : ''}`}
                            >
                                <i className='icon me-2 fs-5'>
                                    <BiDollarCircle className='icon' />
                                </i>
                                <span className='item-name'>Payment</span>
                            </Nav.Link>

                            <Nav.Link
                                as={Link}
                                to={'/main/cards'}
                                className={`nav-item ${location.pathname === '/main/cards' ? 'active' : ''}`}
                            >
                                <i className='icon me-2 fs-5'>
                                    <BiCreditCard className='icon' />
                                </i>
                                <span className='item-name'>Cryto Cards</span>
                            </Nav.Link>

                            <Nav.Link
                                as={Link}
                                to={'/main/dex'}
                                className={`nav-item ${location.pathname === '/main/cards' ? 'active' : ''}`}
                            >
                                <i className='icon me-2 fs-5'>
                                    <FaExchangeAlt className='icon' />
                                </i>
                                <span className='item-name'>ApDex</span>
                            </Nav.Link>

                            <Nav.Link className='nav-item' onClick={handleExportIdentity}>
                                <i className='icon me-2 fs-5'>
                                    <BiExport className='icon' />
                                </i>
                                <span className='item-name'>Export Identity</span>
                            </Nav.Link>
                        </Nav>
                        <div
                            className='d-flex align-items-center ms-3'
                            style={{ marginBottom: '20px', position: 'absolute', bottom: '0', width: '100%' }}
                        >
                            <img
                                src={identity.picture}
                                alt='User'
                                className='rounded-circle'
                                style={{ width: '40px', height: '40px' }}
                            />
                            <div className='caption ms-2'>
                                <h5 className='mb-0 caption-title'>{identity.name}</h5>
                                <p className='mb-0 caption-sub-title'>{formatString(connectedDid)}</p>
                            </div>
                            <MdLogout
                                className='ms-3 text-primary fs-3'
                                onClick={() => {
                                    navigate('/');
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}
            <ExportIdentity state={openExportModal} close={() => setOpenExportModal(false)} />
        </>
    );
};

export default Topbar;

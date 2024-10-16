import React from 'react';
import { images } from '@/helpers/images';
import { Form, FloatingLabel, Tab, Tabs, Button, Row, Col } from 'react-bootstrap';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaLock, FaAddressCard, FaPerson, FaIdCard } from 'react-icons/fa6';
import FinDIDSDK from '@/sdk';
import StatusModal from './StatusModal';
import { GoogleLogin, googleLogout, GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { GOOGLE_CLIENT_ID } from '@/constants';
import GoogleLogo from '@/components/GoogleLogo';
import Loader from '@/components/Loader';

function Init() {
    const navigate = useNavigate();
    const redirectUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    const [loading, setLoading] = useState(true);
    const [name, setName] = useState('');
    const [identityName, setIdentityName] = useState('');
    const [password, setPassword] = useState('');
    const [allIdentities, setAllIdentities] = useState([]);
    const [selectedIdentity, setSelectedIdentity] = useState('');
    const [image, setImage] = useState<string | undefined>(undefined);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const imageInputRef = useRef<HTMLInputElement | null>(null);
    const googleButtonRef = useRef<HTMLInputElement | null>(null);
    const [fileContent, setFileContent] = useState(null);
    const [fileName, setFileName] = useState('');
    const [openLoginModal, setOpenLoginModal] = useState(false);
    const [loginModalMessage, setLoginModalMessage] = useState({
        id: 0,
        message: '',
        spinner: false
    });
    function generateNonce() {
        const array = new Uint32Array(10);
        window.crypto.getRandomValues(array);
        return Array.from(array, dec => dec.toString(36)).join('');
    }
    const searchParams = new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        redirect_uri: `${window.location.origin}/callback`,
        response_type: 'id_token',
        scope: 'openid email profile',
        nonce: generateNonce()
    });
    redirectUrl.search = searchParams.toString();
    useEffect(() => {
        sessionStorage.clear();
        init();
    }, []);

    const init = async () => {
        const identities = await FinDIDSDK.checkExistingIdentity();
        setAllIdentities(
            identities.map(iden => {
                return {
                    name: JSON.parse(iden.metadata.name),
                    uri: iden.metadata.uri
                };
            })
        );
        setLoading(false);
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e: ProgressEvent<FileReader>) => {
                const content = e.target?.result as ArrayBuffer;
                const decodedContent = new TextDecoder().decode(content);
                setFileContent(decodedContent);
                sessionStorage.setItem("identity_encrypted", decodedContent)
                setFileName(file.name);
            };
            reader.readAsArrayBuffer(file);
        } else {
            console.error('No file selected or file type is unsupported');
        }
    };

    const handleImportIdentity = async () => {
        try {
            sessionStorage.setItem("operation", "import")
            const searchParams = new URLSearchParams({
                client_id: GOOGLE_CLIENT_ID,
                redirect_uri: `${window.location.origin}/callback`,
                response_type: 'id_token',
                scope: 'openid email profile',
                nonce: generateNonce()
            });
          
            redirectUrl.search = searchParams.toString();
            window.location.href = redirectUrl.href;
            // setLoginModalMessage({
            //     id: 2,
            //     message: 'We are importing your identity ...',
            //     spinner: true
            // });
            // setOpenLoginModal(true);
            // const did = await FinDIDSDK.importIdentity(fileContent, password);

            // sessionStorage.setItem('connectedDid', did);
            // setLoginModalMessage({
            //     id: 1,
            //     message: 'Welcome to FinDID',
            //     spinner: false
            // });
            // setTimeout(() => {
            //     navigate('/main/dashboard');
            // }, 1500);
        } catch (e) {
            if (e.message === 'Malformed UTF-8 data') {
                setLoginModalMessage({
                    id: 0,
                    message: 'Wrong Password',
                    spinner: false
                });
            }
            if (e.message.startsWith('DwnKeyStore: Import failed due')) {
                setLoginModalMessage({
                    id: 0,
                    message: 'Identity already imported. Please login',
                    spinner: false
                });
            }
        }
    };
    const handleRegister = async userData => {
        let data;
        if (userData) {
            data = {
                name: userData.name,
                picture: userData.picture,
                identityName: userData.name
            };
        } else {
            data = {
                name: name,
                picture: image,
                identityName: identityName
            };
        }
        handleCreateDIDAndRegister(data);
    };

    const handleLogin = async () => {
        setLoginModalMessage({
            id: 1,
            message: 'Welcome to FinDID',
            spinner: false
        });
        setOpenLoginModal(true);
        sessionStorage.setItem('connectedDid', selectedIdentity);
        setTimeout(() => {
            navigate('/main/dashboard');
        }, 1500);
    };

    const handleCreateDIDAndRegister = async data => {
        try {
            let existingIdentity = await FinDIDSDK.checkExistingIdentity();
            if (existingIdentity.length) {
                setLoginModalMessage({
                    id: 0,
                    message: 'Decentralized Identity Already found. Please try to login or Import identity',
                    spinner: false
                });
                setOpenLoginModal(true);
                return;
            }
            setLoginModalMessage({
                id: 2,
                message: 'We are Creating your identity ...',
                spinner: true
            });
            setOpenLoginModal(true);
            await new Promise(r => setTimeout(r, 1000));
            const did = await FinDIDSDK.createIdentity(data);
            // appendIdentity({
            //     did,
            //     name: data.identityName
            // });
            // sessionStorage.setItem('connectedDid', did);
            // setLoginModalMessage({
            //     id: 1,
            //     message: 'Welcome to FinDID',
            //     spinner: false
            // });
            // setTimeout(() => {
            //     navigate('/main/dashboard');
            // }, 1500);
        } catch (e) {
            setLoginModalMessage({
                id: 0,
                message: e.message,
                spinner: false
            });
        }
    };
    const formatString = (str: string) => {
        if (str.length <= 20) {
            return str;
        }
        return str.slice(0, 10) + '...' + str.slice(-10);
    };

    if (loading) {
        return <Loader />;
    }
    return (
        <div>
            <div className='wrapper'>
                <section className='vh-100 bg-image'>
                    <div className='container h-100'>
                        <div className='row justify-content-center h-100 align-items-center'>
                            <div className='col-md-6 mt-5'>
                                <div className='card'>
                                    <div className='card-body'>
                                        <div className='auth-form'>
                                            <div className='d-flex justify-content-center align-item-center'>
                                                <img src={images.logo1} alt='gm' width={150} height={150} />
                                            </div>

                                            <Tabs
                                                defaultActiveKey='home'
                                                id='uncontrolled-tab-example'
                                                className='mb-3 mt-5'
                                                fill
                                                variant='pills'
                                            >
                                                <Tab eventKey='home' title='Login'>
                                                    <div className='section'>
                                                        <h4 className='mt-5 text-center'>Login </h4>
                                                        {allIdentities.length ? (
                                                            <>
                                                                <div className='form-group mt-5'>
                                                                    <label className='form-label mx-auto'>
                                                                        Select your Identity
                                                                    </label>
                                                                    <Form.Select
                                                                        aria-label='Default select example'
                                                                        onChange={e => setSelectedIdentity(e.target.value)}
                                                                    >
                                                                        <option value=''>Select an Identity</option>
                                                                        {allIdentities.map((identity, index) => (
                                                                            <option key={index} value={identity.uri}>
                                                                                {identity.name.identity_name} -{' '}
                                                                                {formatString(identity.uri)}
                                                                            </option>
                                                                        ))}
                                                                    </Form.Select>
                                                                </div>
                                                                <div className='d-flex justify-content-center align-item-center mt-3'>
                                                                    <Button
                                                                        variant='success'
                                                                        onClick={handleLogin}
                                                                        disabled={!selectedIdentity}
                                                                    >
                                                                        Login
                                                                    </Button>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <h6 className='mt-3 text-danger text-center'>
                                                                    No Identities found. Please try to import identity or
                                                                    register.
                                                                </h6>
                                                            </>
                                                        )}
                                                        <div className='separator'>
                                                            <hr className='line' />
                                                            <span className='or-text'>OR</span>
                                                            <hr className='line' />
                                                        </div>
                                                        <Form.Group controlId='formFile' className='mb-1 text-center'>
                                                            <h4 className='mt-4 mb-3'>Import Identity</h4>
                                                            {!fileContent && (
                                                                <div>
                                                                    <Form.Control
                                                                        type='file'
                                                                        ref={fileInputRef}
                                                                        onChange={handleFileChange}
                                                                        style={{
                                                                            opacity: 0,
                                                                            position: 'absolute',
                                                                            zIndex: -1
                                                                        }}
                                                                        accept='.pem'
                                                                    />

                                                                    <Button
                                                                        onClick={() => {
                                                                            fileInputRef?.current?.click();
                                                                        }}
                                                                    >
                                                                        Choose File
                                                                    </Button>
                                                                </div>
                                                            )}
                                                            {fileContent && (
                                                                <div>
                                                                    <h6 className='text-success mt-3 mb-4'>
                                                                        Identity Key file {fileName} loaded
                                                                    </h6>
                                                                    <Button
                                                                        variant='secondary'
                                                                        onClick={handleImportIdentity}
                                                                    >
                                                                        <GoogleLogo />
                                                                        <span className='ms-3'>Import Identity with google</span>
                                                                    </Button>
                                                                  
                                                                </div>
                                                            )}
                                                        </Form.Group>
                                                    </div>
                                                </Tab>
                                                <Tab eventKey='profile' title='Register'>
                                                    <h5 className='text-center mb-4 mt-5'>Create Your Identity with Google</h5>
                                                    {/* <div className='d-flex justify-content-center align-item-center mt-5'>
                                                        <img
                                                            src={image || images.placeholderImage}
                                                            alt='Selected'
                                                            style={{
                                                                width: '100px',
                                                                height: '100px',
                                                                borderRadius: '50%',
                                                                marginTop: '10px',
                                                                marginBottom: '10px',
                                                                objectFit: 'cover',
                                                                border: '4px solid white',
                                                                cursor: 'pointer'
                                                            }}
                                                            onClick={() => {
                                                                imageInputRef?.current?.click();
                                                            }}
                                                        />
                                                    </div>

                                                    <input
                                                        ref={imageInputRef}
                                                        id='fileInput'
                                                        type='file'
                                                        accept='image/*'
                                                        style={{ display: 'none' }}
                                                        onChange={handleImageUpload}
                                                    />
                                                    <div className='form-floating custom-form-floating form-group mb-3 mt-2'>
                                                        <Form.Control
                                                            type='text'
                                                            className='form-control'
                                                            placeholder='Your Name'
                                                            value={name}
                                                            required
                                                            onChange={e => setName(e.target.value)}
                                                        />
                                                        <label>
                                                            <FaUser className='me-2' />
                                                            Your Name
                                                        </label>
                                                    </div> */}

                                                    <div className='form-floating custom-form-floating form-group mb-3 mt-2'>
                                                        <Form.Control
                                                            type='text'
                                                            className='form-control'
                                                            placeholder='Identity Name'
                                                            value={identityName}
                                                            required
                                                            onChange={e => setIdentityName(e.target.value)}
                                                        />
                                                        <label>
                                                            <FaIdCard className='me-2' />
                                                            Identity Name
                                                        </label>
                                                    </div>

                                                    <div className='d-flex justify-content-center align-item-center'>
                                                        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
                                                            {/* <GoogleLoginButton
                                                                enabled={identityName}
                                                                callback={data => callback(data)}
                                                            /> */}
                                                            <a
                                                                href={redirectUrl.toString()}
                                                                style={{
                                                                    textDecoration: 'none'
                                                                }}
                                                            >
                                                                <Button
                                                                    variant='secondary'
                                                                    disabled={!identityName}
                                                                    onClick={() => {
                                                                        sessionStorage.setItem('iname', identityName);
                                                                    }}
                                                                >
                                                                    <GoogleLogo />
                                                                    <span className='ms-3'>Create Identity with Google</span>
                                                                </Button>
                                                            </a>
                                                        </GoogleOAuthProvider>
                                                        {/* <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
                                                            <div style={{ display: '' }}>
                                                                <GoogleLogin
                                                                    ux_mode='redirect'
                                                                    theme='filled_black'
                                                                    shape='square'
                                                                    width={200}
                                                                    auto_select={false}
                                                                    onSuccess={handleSuccess}
                                                                    onError={handleError}
                                                                />
                                                            </div>
                                                        </GoogleOAuthProvider> */}
                                                    </div>
                                                </Tab>
                                            </Tabs>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            <StatusModal state={openLoginModal} close={() => setOpenLoginModal(false)} message={loginModalMessage} />
        </div>
    );
}

export default Init;

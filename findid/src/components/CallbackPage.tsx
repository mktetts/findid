import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Loader from '@/components/Loader';
import { images } from '@/helpers/images';
import FinDIDSDK from '@/sdk';
import { jwtDecode } from 'jwt-decode';
import { Button, Form } from 'react-bootstrap';
import { FaLock } from 'react-icons/fa6';

function CallbackPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [jwt, setJWT] = useState(null);
    const [encryptedIdentity, setEncryptedIdentity] = useState('');
    const [operation, setOperation] = useState('');
    const [password, setPassword] = useState('');
    const [loadingMessage, setLoadingMessage] = useState('');
    const fragmentParams = new URLSearchParams(window.location.hash.substring(1));
    const idToken = fragmentParams.get('id_token');
    useEffect(() => {
        if (idToken) {
            let type = sessionStorage.getItem('operation');
            if (type === 'import') {
                setOperation('import');
                setLoadingMessage('Importing Your Identity...');
                setJWT(jwtDecode(idToken));
                setEncryptedIdentity(sessionStorage.getItem('identity_encrypted'));
            } else {
                setLoadingMessage('Creating Your Identity...');
                const userData = jwtDecode(idToken);
                const identity_name = sessionStorage.getItem('iname');
                handleCreateDIDAndRegister(userData, identity_name);
            }
        }
    }, [idToken]);

    const handleCreateDIDAndRegister = async (jwt_data, identity_name) => {
        try {
            let data = {
                username: jwt_data.name,
                email: jwt_data.email,
                profile: jwt_data.picture,
                identity_name,
                iss: jwt_data.iss,
                sub: jwt_data.sub,
                aud: jwt_data.aud
            };
            await new Promise(r => setTimeout(r, 1000));
            const did = await FinDIDSDK.createIdentity(data);
            await FinDIDSDK.addMyIdentity(did, data);
            setLoading(false);
            setLoadingMessage('Identity Created Successfully');
            setTimeout(() => {
                navigate('/');
            }, 1500);
        } catch (e) {
            // setLoading(false)
            setLoadingMessage(e.message);
        }
    };

    const handleImportIdentity = async () => {
        try {
            setOperation('');
            const did = await FinDIDSDK.importIdentity(encryptedIdentity, jwt, password);
            sessionStorage.setItem('connectedDid', did);
            setLoadingMessage("Successfully Identity Imported")
            setTimeout(() => {
                navigate('/main/dashboard');
            }, 1500);
        } catch (e) {
            if (e.message.startsWith('DwnKeyStore: Import failed due')) {
                setLoadingMessage("Identity already imported. Please login")
            }
            else{
                setLoadingMessage(e.message);
            }
             setTimeout(() => {
                navigate('/');
            }, 2500);
        }
    };
    return (
        <div className='align-items-center justify-content-center'>
            {loading && <Loader />}
            {!loading && (
                <div className='d-flex align-items-center justify-content-center'>
                    <img src={images.okImage} width={150} />
                </div>
            )}
            {operation === 'import' && (
                <div>
                    <div className='d-flex justify-content-center align-item-center'>
                        <div className='form-floating custom-form-floating form-group mb-3 mt-2 w-50  '>
                            <Form.Control
                                type='text'
                                className='form-control'
                                placeholder='Your Name'
                                value={password}
                                required
                                onChange={e => setPassword(e.target.value)}
                            />
                            <label>
                                <FaLock className='me-2' />
                                Enter password 
                            </label>
                        </div>
                    </div>

                    <div className='d-flex justify-content-center align-item-center'>
                        <Button variant='secondary' onClick={handleImportIdentity}>
                            Import Identity
                        </Button>
                    </div>
                </div>
            )}
            <div className='text-center fs-4 mt-5 '>{loadingMessage}</div>u
        </div>
    );
}

export default CallbackPage;

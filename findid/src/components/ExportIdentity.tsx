import { images } from '@/helpers/images';
import { Modal, Form, Button } from 'react-bootstrap';
import CryptoJS from 'crypto-js';
import { useEffect, useState } from 'react';
import FinDIDSDK from '@/sdk';

interface ModalStore {
    state: boolean;
    close: () => void;
}
function ExportIdentity(props: ModalStore) {
    const [password, setPassword] = useState('');
    const [connectedDid, setConnectedDid] = useState('');
    useEffect(() => {
        let connectedDid = sessionStorage.getItem('connectedDid');
        setConnectedDid(connectedDid);
    }, []);
    const handleExportIdentity = async () => {
        const identity = await FinDIDSDK.exportIdentity(connectedDid);
        const jsonString = JSON.stringify(identity);
        const encryptedData = CryptoJS.AES.encrypt(jsonString, password).toString();
        const blob = new Blob([encryptedData], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'findid_identity.pem';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    const [strength, setStrength] = useState('');
    const [feedback, setFeedback] = useState([]);
    const calculatePasswordStrength = password => {
        let strengthScore = 0;
        const feedbackMessages = [];
        // Conditions to check
        const hasLowerCase = /[a-z]/.test(password);
        const hasUpperCase = /[A-Z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSymbols = /[@$!%*?&#]/.test(password);
        const isLongEnough = password.length >= 8;

        if (!hasLowerCase) feedbackMessages.push('Password must contain at least one lowercase letter.');
        if (!hasUpperCase) feedbackMessages.push('Password must contain at least one uppercase letter.');
        if (!hasNumbers) feedbackMessages.push('Password must contain at least one number.');
        if (!hasSymbols) feedbackMessages.push('Password must contain at least one special character (@, $, !, %).');
        if (!isLongEnough) feedbackMessages.push('Password must be at least 8 characters long.');

        // Increment score based on conditions
        if (hasLowerCase) strengthScore += 1;
        if (hasUpperCase) strengthScore += 1;
        if (hasNumbers) strengthScore += 1;
        if (hasSymbols) strengthScore += 1;
        if (isLongEnough) strengthScore += 1;

        // Determine strength level based on the score
        if (strengthScore <= 2) {
            setStrength('Weak');
        } else if (strengthScore === 3 || strengthScore === 4) {
            setStrength('Medium');
        } else if (strengthScore === 5) {
            setStrength('Strong');
        } else {
            setStrength('');
        }

        setFeedback(feedbackMessages);
    };
    const getStrengthClass = () => {
        switch (strength) {
            case 'Weak':
                return 'bg-danger';
            case 'Medium':
                return 'bg-warning';
            case 'Strong':
                return 'bg-success';
            default:
                return '';
        }
    };
    const isButtonEnabled =
        password.trim() !== '' &&
        password.length >= 8 && 
        strength === 'Strong';
    return (
        <div>
            <Modal show={props.state} onHide={props.close} backdrop='static' keyboard={false}>
                <Modal.Header closeButton>
                    <Modal.Title>Exporting Identity</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className='mb-3' controlId='exampleForm.ControlInput1'>
                            <Form.Label>Enter Password to Encrypt the export</Form.Label>
                            <Form.Control
                                type='password'
                                placeholder='password'
                                value={password}
                                onChange={e => {
                                    setPassword(e.target.value);
                                    calculatePasswordStrength(e.target.value)
                                }}
                            />
                        </Form.Group>
                    </Form>
                    {password && (
                            <div className='mt-2'>
                                <p>
                                    Password Strength: <strong>{strength}</strong>
                                </p>

                                {/* Password strength progress bar */}
                                <div className='progress'>
                                    <div
                                        className={`progress-bar ${getStrengthClass()}`}
                                        role='progressbar'
                                        style={{ width: `${(password.length / 12) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        )}
                        {strength !== 'Strong' && password && (
                            <div className='mt-3'>
                                <p>
                                    <strong>Improve your password:</strong>
                                </p>
                                <ul>
                                    {feedback.map((message, index) => (
                                        <li key={index}>{message}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    <div className='d-flex align-item-center justify-content-center mt-4'>
                        <Button variant='success' onClick={handleExportIdentity} disabled={!isButtonEnabled}>
                            Export as Encrypted .pem file
                        </Button>
                    </div>
                </Modal.Body>
            </Modal>
        </div>
    );
}

export default ExportIdentity;

import { Modal, Spinner } from 'react-bootstrap';
import { images } from '@/helpers/images';
import Loader from '@/components/Loader';

interface ModalStore {
    state: boolean;
    message: { id: number; message: string; spinner: boolean };
    close: () => void;
}
function StatusModal(props: ModalStore) {
    return (
        <div>
            <Modal show={props.state} onHide={props.close}  backdrop='static' keyboard={false}>
                <Modal.Header closeButton>
                    <Modal.Title>Login to FinDID</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {props.message.id === 0 && (
                        <div className='d-flex justify-content-center align-item-center'>
                            <img
                                src={images.crossImage}
                                alt='Selected'
                                style={{
                                    width: '100px',
                                    height: '100px',
                                    marginTop: '10px',
                                    marginBottom: '10px',
                                    objectFit: 'cover',
                                }}
                            />
                        </div>
                    )}
                    {props.message.id === 1 && (
                        <div className='d-flex justify-content-center align-item-center'>
                            <img
                                src={images.okImage}
                                alt='Selected'
                                style={{
                                    width: '100px',
                                    height: '100px',
                                    marginTop: '10px',
                                    marginBottom: '10px',
                                    objectFit: 'cover',
                                }}
                            />
                        </div>
                    )}
                    {props.message.spinner && (
                        <div className='d-flex justify-content-center align-items-center' >
                            {props.message.spinner && (
                                <Spinner
                                    animation='border'
                                    role='status'
                                    style={{ width: '3rem', height: '3rem' }}
                                >
                                    <span className='visually-hidden'>Loading...</span>
                                </Spinner>
                            )}
                        </div>
                    )}
                     <h5 className='mt-3 text-center' style={{ wordBreak: 'break-word' }}>
                        {props.message?.message}
                    </h5>
                </Modal.Body>
            </Modal>
        </div>
    );
}

export default StatusModal;

import React, { useEffect, useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import Dashboard from '@/pages/dashboard/Dashboard';
import { images } from '@/helpers/images';
import FinDIDSDK from '@/sdk';
import Topbar from '@/components/Topbar';
import Payment from './payment/Payment';
import CryptoCards from './cryptocards/CryptoCards';
import useWeb5InstanceStore from '@/store/web5Store';
import Loader from '@/components/Loader';
import Dex from './dex/Dex';

function Main() {
    const [identity, setIdentity] = useState('');
    const [loading, setLoading] = useState(true);
    const { getWeb5 } = useWeb5InstanceStore();
    useEffect(() => {
        init();
    }, []);
    const init = async () => {
        try {
            let identity = sessionStorage.getItem('identity');
            let connectedDid = sessionStorage.getItem('connectedDid');
            if (!identity) {
                const identity = await FinDIDSDK.retreiveIdentity(await getWeb5(), connectedDid);
                if (identity) {
                    setIdentity(identity);
                    sessionStorage.setItem('identity', JSON.stringify(identity));
                }
            } else {
                setIdentity(JSON.parse(identity));
            }
        } catch (e) {
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <Loader />;
    }
    return (
        <div>
            <Topbar identity={identity} />
            <div
                className='content'
                style={{
                    paddingLeft: '40px',
                    paddingRight: '40px',
                    paddingBottom: '80px',
                    paddingTop: '20px'
                }}
            >
                <Routes>
                    <Route path='/dashboard' element={<Dashboard identity={identity} />} />
                    <Route path='/payment' element={<Payment />} />
                    <Route path='/cards' element={<CryptoCards />} />
                    <Route path='/dex' element={<Dex />} />
                </Routes>
            </div>
        </div>
    );
}

export default Main;

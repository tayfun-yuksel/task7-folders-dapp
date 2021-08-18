/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-use-before-define */
import React, { useEffect, useState } from 'react';
import Web3 from 'web3';
import { ToastContainer, toast } from 'react-toastify';
import './app.scss';
import 'react-toastify/dist/ReactToastify.css';
import { PolyjuiceHttpProvider } from '@polyjuice-provider/web3';
import { AddressTranslator } from 'nervos-godwoken-integration';

import { FoldersWrapper } from '../lib/contracts/FoldersWrapper';
import { CONFIG } from '../config';

const CONTRACT_ADDRESS = '0x12208DbFFd6a07F76d4023a8ffDA28353cda4631';
async function createWeb3() {
    // Modern dapp browsers...
    if ((window as any).ethereum) {
        const godwokenRpcUrl = CONFIG.WEB3_PROVIDER_URL;
        const providerConfig = {
            rollupTypeHash: CONFIG.ROLLUP_TYPE_HASH,
            ethAccountLockCodeHash: CONFIG.ETH_ACCOUNT_LOCK_CODE_HASH,
            web3Url: godwokenRpcUrl
        };

        const provider = new PolyjuiceHttpProvider(godwokenRpcUrl, providerConfig);
        const web3 = new Web3(provider || Web3.givenProvider);

        try {
            // Request account access if needed
            await (window as any).ethereum.enable();
        } catch (error) {
            // User denied account access...
        }

        return web3;
    }

    console.log('Non-Ethereum browser detected. You should consider trying MetaMask!');
    return null;
}

export function App() {
    const [web3, setWeb3] = useState<Web3>(null);
    const [contract, setContract] = useState<FoldersWrapper>();
    const [accounts, setAccounts] = useState<string[]>();
    const [l2Balance, setL2Balance] = useState<bigint>();
    const [existingContractIdInputValue, setExistingContractIdInputValue] = useState<string>();
    const [deployTxHash, setDeployTxHash] = useState<string | undefined>();
    const [polyjuiceAddress, setPolyjuiceAddress] = useState<string | undefined>();
    const [transactionInProgress, setTransactionInProgress] = useState(false);
    const toastId = React.useRef(null);
    const [currentFolderName, setCurrentFolderName] = useState<string>();
    const [folder, setFolder] = useState<{ id: string; name: string }>();

    const [loading, setLoading] = useState<boolean>(false);
    const [currentIndex, setCurrentIndex] = useState<number>(1);
    const [folderIndexes, setFolderIndexes] = useState<number[]>();

    useEffect(() => {
        if (accounts?.[0]) {
            const addressTranslator = new AddressTranslator();
            setPolyjuiceAddress(addressTranslator.ethAddressToGodwokenShortAddress(accounts?.[0]));
        } else {
            setPolyjuiceAddress(undefined);
        }
    }, [accounts?.[0]]);

    useEffect(() => {
        if (transactionInProgress && !toastId.current) {
            toastId.current = toast.info(
                'Transaction in progress. Confirm MetaMask signing dialog and please wait...',
                {
                    position: 'top-right',
                    autoClose: false,
                    hideProgressBar: false,
                    closeOnClick: false,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    closeButton: false
                }
            );
        } else if (!transactionInProgress && toastId.current) {
            toast.dismiss(toastId.current);
            toastId.current = null;
        }
    }, [transactionInProgress, toastId.current]);

    const account = accounts?.[0];

    useEffect(() => {
        if (contract && web3) {
            setExistingContractAddress(CONTRACT_ADDRESS);
        }
        if (contract && web3 && accounts) {
            makeFolderIndexArray();
            getFolder();
        }
    }, [contract, web3, accounts]);

    async function getFolderSize() {
        const total = await contract.totalFolder(account);
        return total;
    }

    async function getFolder() {
        setLoading(true);
        const _folder = await contract.getFolder(Number(currentIndex), account);
        toast('Successfully read the current folder 📁', { type: 'success' });
        const modifiedFolder = { id: _folder.folderId, name: _folder.name };
        setFolder(modifiedFolder);
        setLoading(false);
    }

    async function makeFolderIndexArray() {
        const arr: number[] = [];
        const max = Number(await contract.totalFolder(account));
        for (let i = 1; i <= max; i++) {
            arr.push(i);
        }
        setFolderIndexes(arr);
    }

    async function setExistingContractAddress(contractAddress: string) {
        const _contract = new FoldersWrapper(web3);
        _contract.useDeployed(contractAddress.trim());
    }

    async function makeNewFolder() {
        try {
            setTransactionInProgress(true);
            await contract.makeNewFolder(currentFolderName, account);
            await makeFolderIndexArray();
            toast('Successfully created new folder 📁 ', { type: 'success' });
        } catch (error) {
            console.error(error);
            toast.error(
                'There was an error sending your transaction. Please check developer console.'
            );
        } finally {
            setTransactionInProgress(false);
        }
    }

    useEffect(() => {
        if (web3) {
            return;
        }

        (async () => {
            const _web3 = await createWeb3();
            setWeb3(_web3);

            const _accounts = [(window as any).ethereum.selectedAddress];
            setAccounts(_accounts);
            console.log({ _accounts });
            const _contract = new FoldersWrapper(_web3);
            setContract(_contract);

            if (_accounts && _accounts[0]) {
                const _l2Balance = BigInt(await _web3.eth.getBalance(_accounts[0]));
                setL2Balance(_l2Balance);
            }
        })();
    });

    const LoadingIndicator = () => <span className="rotating-icon">⚙️</span>;

    return (
        //
        <div style={{ display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
            <h1>Folder Management</h1>
            Folders Contract Address: <b>{CONTRACT_ADDRESS}</b>
            <br />
            <br />
            Your ETH address: <b>{accounts?.[0]}</b>
            <br />
            <br />
            Your Polyjuice address: <b>{polyjuiceAddress || ' - '}</b>
            <br />
            <br />
            Nervos Layer 2 balance:{' '}
            <b>{l2Balance ? (l2Balance / 10n ** 8n).toString() : <LoadingIndicator />} CKB</b>
            <br />
            <hr />
            <div>
                <h3>Folders</h3>
                <br />
                <br />
                <input
                    type="text"
                    placeholder="Folder Name..."
                    value={currentFolderName}
                    onChange={e => setCurrentFolderName(e.target.value)}
                />
                <button onClick={makeNewFolder}> 📁 Create Folder </button>
                <br />
                <br />
                <br />
                <select
                    style={{ padding: '0.4rem' }}
                    name="indexes"
                    id="indexes"
                    onChange={e => setCurrentIndex(Number(e.target.value))}
                >
                    {folderIndexes?.map(index => (
                        <option key={index} value={index}>
                            {index}
                        </option>
                    ))}
                </select>
                <button style={{ margin: '0.4rem' }} onClick={getFolder}>
                    Get Folder
                </button>
                <br />
                <br />
                <br />

                {loading && <LoadingIndicator />}
                {!loading && (
                    <div className="show-folder">
                        <figure>
                            <img
                                alt="folder"
                                src=" https://lh3.googleusercontent.com/proxy/qinmQilPS98HeMNMtxb4fRia2UOl1K6lfwEFC_llqdvzwAKCQVzvNMY86ZZGdbLGuXAjo4Pm14e-awiqjET96Y8coEqH3a000uFZwW88zkwMCQE7RjcsmWenlc7neuUZeg"
                                style={{ width: 60, height: 60 }}
                            />
                            <figcaption>{folder?.name}</figcaption>
                        </figure>
                    </div>
                )}
            </div>
            <ToastContainer />
        </div>
    );
}

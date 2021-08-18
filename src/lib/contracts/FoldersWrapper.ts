import Web3 from 'web3';
import * as FoldersJSON from '../../../build/contracts/Folders.json';
import { Folders } from '../../types/Folders';

const DEFAULT_SEND_OPTIONS = {
    gas: 6000000
};
const CONTRACT_ADDRESS = '0x12208DbFFd6a07F76d4023a8ffDA28353cda4631';
export class FoldersWrapper {
    web3: Web3;

    contract: Folders;

    address: string;

    constructor(web3: Web3) {
        this.web3 = web3;
        this.contract = new web3.eth.Contract(FoldersJSON.abi as any) as any;
        this.useDeployed(CONTRACT_ADDRESS);
    }

    get isDeployed() {
        return Boolean(this.address);
    }

    async getFolder(id: number, fromAddress: string) {
        const folder = await this.contract.methods.folders(id).call({ from: fromAddress });

        return folder;
    }

    async totalFolder(fromAddress: string) {
        const total = await this.contract.methods.getTotalFolder().call({ from: fromAddress });

        return parseInt(total, 10);
    }

    async makeNewFolder(name: string, fromAddress: string) {
        const tx = await this.contract.methods.makeNewFolder(name).send({
            ...DEFAULT_SEND_OPTIONS,
            from: fromAddress
        });

        return tx;
    }

    async deploy(fromAddress: string) {
        const tx = this.contract
            .deploy({
                data: FoldersJSON.bytecode,
                arguments: []
            })
            .send({
                ...DEFAULT_SEND_OPTIONS,
                from: fromAddress
            });

        let transactionHash: string = null;
        tx.on('transactionHash', (hash: string) => {
            transactionHash = hash;
        });

        const contract = await tx;

        this.useDeployed(contract.options.address);

        return transactionHash;
    }

    useDeployed(contractAddress: string) {
        this.address = contractAddress;
        this.contract.options.address = contractAddress;
    }
}

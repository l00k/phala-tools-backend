import { SignerOptions } from '@polkadot/api/submittable/types';
import { SubmittableExtrinsic } from '@polkadot/api/types';
import { KeyringPair } from '@polkadot/keyring/types';
import colors from 'colors';
import { Inject } from '@inti5/object-manager';
import { Logger } from '@inti5/utils/Logger';


export class TransactionHandler
{
    
    @Inject({ ctorArgs: [ 'PolkadotTransactionHandler' ] })
    protected _logger : Logger;
    
    
    public async handleApiRequest (
        transaction : SubmittableExtrinsic<any>,
        keyringPair : KeyringPair,
        transactionId : string,
        options? : Partial<SignerOptions>
    ) : Promise<void>
    {
        return new Promise<void>(async(resolve, reject) => {
            const unsub : any = await transaction
                .signAndSend(keyringPair, options, ({ status }) => {
                    if (status.isReady) {
                        this._logger.log(transactionId + ': ' + colors.grey('ready'));
                    }
                    else if (status.isBroadcast) {
                        this._logger.log(transactionId + ': ' + colors.grey('brodcast'));
                    }
                    else if (status.isInvalid) {
                        this._logger.log(transactionId + ': ' + colors.red('invalid'));
                        reject();
                    }
                    else if (status.isDropped) {
                        this._logger.log(transactionId + ': ' + colors.red('dropped'));
                        reject();
                    }
                    else if (status.isRetracted) {
                        this._logger.log(transactionId + ': ' + colors.red('retracted'));
                        reject();
                    }
                    else if (status.isInBlock) {
                        this._logger.log(transactionId + ': ' + colors.green('in block'));
                        resolve();
                    }
                    else if (status.isUsurped) {
                        this._logger.log(transactionId + ': ' + colors.green('is usurped'));
                        reject();
                    }
                    
                    if (status.isFinalized || status.isFinalityTimeout) {
                        resolve();
                        unsub();
                    }
                });
        });
    }
    
}

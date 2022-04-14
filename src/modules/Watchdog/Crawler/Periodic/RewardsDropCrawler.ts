import { Exception } from '#/BackendCore/Exception';
import { KhalaTypes } from '#/Phala/Api/KhalaTypes';
import { Utility as PhalaUtility } from '#/Phala/Utility';
import { Observation, ObservationMode } from '#/Watchdog/Domain/Model/Observation';
import { ObservationType } from '#/Watchdog/Domain/Model/Observation/ObservationNotifications';
import { AbstractCrawler } from '#/Watchdog/Service/PeriodicCrawler/AbstractCrawler';
import { Header } from '@polkadot/types/interfaces/runtime';


export class RewardsDropCrawler
    extends AbstractCrawler
{
    
    protected static readonly BLOCKS_CHUNK = 3600; // 1d based on 24bps
    
    protected readonly _messageTitle : string = '🚨 Pool performance drop';
    protected readonly _observationType : ObservationType = ObservationType.RewardsDrop;
    protected readonly _observationMode : ObservationMode = null;
    
    
    protected async _getObservedValuePerStakePool (onChainId : number) : Promise<number>
    {
        const finalizedHead = await this._api.rpc.chain.getFinalizedHead();
        const finalizedBlockHeader : Header = await this._api.rpc.chain.getHeader(finalizedHead);
        const finalizedBlockNumber = finalizedBlockHeader.number.toNumber();
        
        const rewardsNow : number = await this._findRewardsAtBlock(
            onChainId,
            finalizedBlockNumber
        );
        
        let lastChunkRewards : number;
        let avgRewards : number;
        
        try {
            {
                const rewardsPrevious = await this._findRewardsAtBlock(
                    onChainId,
                    finalizedBlockNumber - RewardsDropCrawler.BLOCKS_CHUNK
                );
                
                lastChunkRewards = rewardsNow - rewardsPrevious;
            }
            {
                const rewardsPrevious = await this._findRewardsAtBlock(
                    onChainId,
                    finalizedBlockNumber - 5 * RewardsDropCrawler.BLOCKS_CHUNK
                );
                
                avgRewards = (rewardsNow - rewardsPrevious) / 5;
            }
        }
        catch (e) {
            // unable to calculate avg rewards
            this._logger.warn('Unable to calculate avg value', e);
            return null;
        }
        
        if (avgRewards === 0) {
            return null;
        }
        
        const ratio = lastChunkRewards / avgRewards;
        const dropPercent = (1 - ratio) * 100;
        
        return dropPercent;
    }
    
    protected async _findRewardsAtBlock (onChainId : number, blockNumber : number) : Promise<number>
    {
        const blockHash : string = (await this._api.rpc.chain.getBlockHash(blockNumber)).toString();
        
        const historyStakePoolRaw : any = await this._api.query.phalaStakePool.stakePools.at(blockHash, onChainId);
        const historyStakePool : typeof KhalaTypes.PoolInfo = historyStakePoolRaw.toJSON();
        
        if (!historyStakePool) {
            throw new Exception('Unable to fetch history data', 1637407485035);
        }
        
        return 10 ** 12 * PhalaUtility.decodeBigNumber(historyStakePool.rewardAcc);
    }
    
    protected _prepareMessage (
        onChainId : number,
        observation : Observation,
        observedValue : number
    ) : string
    {
        return '`#' + onChainId + '` rewards dropped by `' + observedValue.toFixed(1) + '%`';
    }
    
}

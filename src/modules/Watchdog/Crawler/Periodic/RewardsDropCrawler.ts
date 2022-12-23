import { KhalaTypes } from '#/Phala/Api/KhalaTypes';
import { Utility as PhalaUtility } from '#/Phala/Utility';
import { Observation } from '#/Watchdog/Domain/Model/Observation';
import { ObservationMode } from '#/Watchdog/Domain/Type/ObservationMode';
import { ObservationType } from '#/Watchdog/Domain/Type/ObservationType';
import { AbstractPeriodicCrawler } from '#/Watchdog/Service/AbstractPeriodicCrawler';
import { Exception } from '@inti5/utils/Exception';
import { Header } from '@polkadot/types/interfaces/runtime';


export class RewardsDropCrawler
    extends AbstractPeriodicCrawler
{
    
    protected static readonly BLOCKS_CHUNK = 3600; // 1d based on 24bps
    
    protected readonly _messageTitle : string = '🚨 Pool performance drop';
    protected readonly _observationType : ObservationType = ObservationType.RewardsDrop;
    protected readonly _observationMode : ObservationMode = null;
    
    
    protected async _getObservedValuePerStakePool (onChainId : number) : Promise<number>
    {
        // todo ld 2022-12-23 20:41:03
        return 0;
    
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
        
        const stakePoolBase : any = <any>(
            await this._api.query.phalaBasePool.pools.at(blockHash, onChainId)
        ).toJSON();
        const stakePool : typeof KhalaTypes.PoolInfo = stakePoolBase.stakePool;
        
        if (!stakePool) {
            throw new Exception('Unable to fetch history data', 1637407485035);
        }
        
        return 10 ** 12 * PhalaUtility.decodeBigNumber(stakePool.rewardAcc);
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

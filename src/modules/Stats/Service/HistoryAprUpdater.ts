import { Network } from '#/App/Domain/Type/Network';
import { AppState } from '#/BackendCore/Domain/Model/AppState';
import { HistoryCrawler } from '#/Stats/Crawler/HistoryCrawler';
import { HistoryCrawlerState } from '#/Stats/Domain/Model/AppState/HistoryCrawlerState';
import { HistoryEntry } from '#/Stats/Domain/Model/HistoryEntry';
import { StakePoolEntry } from '#/Stats/Domain/Model/StakePoolEntry';
import { AbstractCrawler } from '#/Stats/Service/AbstractCrawler';
import { Config } from '@inti5/configuration';


export class HistoryAprUpdater
    extends AbstractCrawler
{
    
    @Config('modules.app.network')
    protected _network : Network;
    
    
    protected _appStateClass : any = HistoryCrawlerState;
    protected _appState : AppState<HistoryCrawlerState>;
    
    
    protected async _process ()
    {
        this._logger.log('Updating history entries');
        
        const stakePoolEntryRepository = this._entityManager.getRepository(StakePoolEntry);
        const historyEntryRepository = this._entityManager.getRepository(HistoryEntry);
        
        const historyEntries : Record<number, HistoryEntry[]> = {};
        
        for (let entryNonce = 1; entryNonce <= this._appState.value.lastProcessedNonce; ++entryNonce) {
            console.log('Nonce', entryNonce);
            
            const stakePoolEntries = await stakePoolEntryRepository.find({
                historyEntries: {
                    entryNonce,
                }
            }, {
                populate: [ 'historyEntries' ]
            });
            
            console.log('StakePools num', stakePoolEntries.length);
            
            for (const stakePoolEntry of stakePoolEntries) {
                if (!historyEntries[stakePoolEntry.id]) {
                    historyEntries[stakePoolEntry.id] = [];
                }
                
                const workingHistoryEntry = stakePoolEntry.historyEntries[0];
                
                historyEntries[stakePoolEntry.id].push(workingHistoryEntry);
                
                await this._calculateAvgApr(
                    workingHistoryEntry,
                    historyEntries[stakePoolEntry.id]
                );
            }
            
            console.log();
            
            await this._entityManager.flush();
        }
    }
    
    protected async _calculateAvgApr (
        workingHistoryEntry : HistoryEntry,
        historyEntries : HistoryEntry[]
    )
    {
        const entriesNum = Math.ceil(30 / HistoryCrawler.HISTORY_ENTRY_INTERVAL);
        
        const historyEntryToCount = historyEntries.slice(-entriesNum);
        
        workingHistoryEntry.avgApr = historyEntryToCount
            .map(entry => entry.currentApr)
            .reduce((acc, curr) => acc + curr, 0) / historyEntryToCount.length;
            
        await this._entityManager.persist(workingHistoryEntry);
    }
    
}

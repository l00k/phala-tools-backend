import { Network } from '#/App/Domain/Type/Network';
import { HistoryCrawler } from '#/Stats/Crawler/HistoryCrawler';
import { HistoryCrawlerState } from '#/Stats/Domain/Model/AppState/HistoryCrawlerState';
import { HistoryEntry } from '#/Stats/Domain/Model/HistoryEntry';
import { StakePoolEntry } from '#/Stats/Domain/Model/StakePoolEntry';
import { AbstractCrawler } from '#/Stats/Service/AbstractCrawler';
import { Config } from '@inti5/configuration';
import { EntityRepository } from '@mikro-orm/core';


export class HistoryAprUpdater
    extends AbstractCrawler
{
    
    @Config('modules.app.network')
    protected _network : Network;
    
    protected _appStateClass : any = HistoryCrawlerState;
    
    
    protected async _process ()
    {
        this._logger.log('Updating history entries');
        
        const stakePoolEntryRepository = this._entityManager.getRepository(StakePoolEntry);
        const historyEntryRepository : EntityRepository<HistoryEntry> = this._entityManager.getRepository(HistoryEntry);
        
        const historyEntries : Record<number, HistoryEntry[]> = {};
        
        const stakePoolEntries : Record<number, StakePoolEntry> = Object.fromEntries(
            (await stakePoolEntryRepository.findAll({ orderBy: { id: 'ASC' } }))
                .map(stakePoolEntry => ([ stakePoolEntry.id, stakePoolEntry ]))
        );
        
        for (let entryNonce = 1; entryNonce <= this._appState.value.lastProcessedNonce; ++entryNonce) {
            console.log('Nonce', entryNonce);
            
            const workingHistoryEntries = await historyEntryRepository.find({
                snapshot: entryNonce,
            }, {
                orderBy: { stakePoolEntry: 'ASC' }
            });
            
            console.log('StakePools num', workingHistoryEntries.length);
            
            for (const workingHistoryEntry of workingHistoryEntries) {
                const stakePoolEntry = workingHistoryEntry.stakePoolEntry;
            
                if (!historyEntries[stakePoolEntry.id]) {
                    historyEntries[stakePoolEntry.id] = [];
                }
                
                historyEntries[stakePoolEntry.id].push(workingHistoryEntry);
                
                this._calculateAvgApr(
                    workingHistoryEntry,
                    historyEntries[stakePoolEntry.id]
                );
            }
            
            console.log();
            
            await this._entityManager.flush();
        }
    }
    
    protected _calculateAvgApr (
        workingHistoryEntry : HistoryEntry,
        historyEntries : HistoryEntry[]
    )
    {
        const entriesNum = Math.ceil(30 / HistoryCrawler.HISTORY_ENTRY_INTERVAL);
        
        const historyEntryToCount = historyEntries.slice(-entriesNum);
        
        workingHistoryEntry.avgApr = historyEntryToCount
            .map(entry => entry.currentApr)
            .reduce((acc, curr) => acc + curr, 0) / historyEntryToCount.length;
    }
    
}

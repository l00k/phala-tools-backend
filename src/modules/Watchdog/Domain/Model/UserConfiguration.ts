import * as Trans from 'class-transformer';
import { Assert } from '@inti5/validator/Object';


@Trans.Exclude()
export class UserConfiguration
{

    @Trans.Expose()
    @Assert({
        presence: true,
        numericality: {
            greaterThanOrEqualTo: 1,
            lessThanOrEqualTo: 1000000,
        },
    })
    public claimRewardsThreshold : number = 100;

    @Trans.Expose()
    @Assert({
        presence: true,
        numericality: {
            greaterThanOrEqualTo: 1,
            lessThanOrEqualTo: 100,
        },
    })
    public changeCommissionThreshold : number = 1;

    @Trans.Expose()
    @Assert({
        presence: true,
        numericality: {
            greaterThanOrEqualTo: 100,
        },
    })
    public contributionThreshold : number = 1000;

    @Trans.Expose()
    @Assert({
        presence: true,
        numericality: {
            greaterThanOrEqualTo: 100,
        },
    })
    public withdrawalThreshold : number = 10000;

    @Trans.Expose()
    @Assert({
        presence: true,
        numericality: {
            greaterThanOrEqualTo: 5,
        },
    })
    public poolPerformanceDropThreshold : number = 25;

    @Trans.Expose()
    @Assert({
        presence: true,
        numericality: {
            greaterThanOrEqualTo: 0,
        },
    })
    public delayUnresponsiveWorkerNotification : number = 1;
    
};

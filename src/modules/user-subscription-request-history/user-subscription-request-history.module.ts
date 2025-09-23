import { CqrsModule } from '@nestjs/cqrs';
import { Module } from '@nestjs/common';

import { UserSubscriptionRequestHistoryRepository } from './repositories/user-subscription-request-history.repository';
import { UserSubscriptionRequestHistoryController } from './user-subscription-request-history.controller';
import { UserSubscriptionRequestHistoryConverter } from './user-subscription-request-history.converter';
import { UserSubscriptionRequestHistoryService } from './user-subscription-request-history.service';
import { COMMANDS } from './commands';
import { QUERIES } from './queries';

@Module({
    imports: [CqrsModule],
    controllers: [UserSubscriptionRequestHistoryController],
    providers: [
        UserSubscriptionRequestHistoryRepository,
        UserSubscriptionRequestHistoryConverter,
        UserSubscriptionRequestHistoryService,
        ...COMMANDS,
        ...QUERIES,
    ],
})
export class UserSubscriptionRequestHistoryModule {}

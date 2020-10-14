import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { SUCCESS } from '@/constants/constants';
import { AppLogger } from '@/common/logger/app.logger';
import { CoreService } from '@/core/core.service';
import { AssetOrigin } from '@/enum/AssetOrigin';

@Injectable()
export class PixivScheduleService {
    constructor(
        private logger: AppLogger,
        private coreService: CoreService,
    ) {
        this.logger.setContext(PixivScheduleService.name);
    }

    @Cron('* 30 * * * *')
    async bot() {
        try {
            await this.coreService.botBaseService(AssetOrigin.pixiv);
        } catch (e) {
            this.logger.error(this.bot.name, e);
        }
        return SUCCESS;
    }
}

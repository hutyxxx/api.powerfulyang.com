import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { PathViewCount } from '@/entity/path.view.count.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CacheService } from '@/core/cache/cache.service';
import { AppLogger } from '@/common/logger/app.logger';
import { groupBy } from 'ramda';
import { REDIS_KEYS } from '@/constants/REDIS_KEYS';
import { ipV4ToLong } from '@powerfulyang/utils';

@Injectable()
export class PathViewCountService {
  constructor(
    @InjectRepository(PathViewCount) private readonly pathViewCountDao: Repository<PathViewCount>,
    private readonly cacheService: CacheService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(PathViewCountService.name);
    this.cache().then(() => {
      this.logger.info('path view count map cached success!');
    });
  }

  async cache() {
    const results = await this.pathViewCountDao.find({
      select: ['path', 'ip'],
    });
    const mapSet = groupBy<PathViewCount>((a) => a.path)(results);
    for (const [path, set] of Object.entries(mapSet)) {
      // 先清理再缓存
      const handleKey = REDIS_KEYS.PATH_VIEW_COUNT_PREFIX(path);
      await this.cacheService.del(handleKey);
      await this.cacheService.sAdd(
        handleKey,
        set.map((x) => x.ip),
      );
    }
    return mapSet;
  }

  async handlePathViewCount(path: string, ip: string) {
    const ipLong = ipV4ToLong(ip);
    const redisKey = REDIS_KEYS.PATH_VIEW_COUNT_PREFIX(path);
    const result = await this.cacheService.sAdd(redisKey, ipLong);
    const viewCount = await this.cacheService.sCard(redisKey);
    if (result > 0) {
      this.pathViewCountDao.insert({ ip: ipLong, path }).catch(() => {
        this.logger.error(`error insert: ip=>${ipLong}, path=>${path}`);
      });
    }
    return viewCount;
  }
}

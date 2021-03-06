import { join } from 'path';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { __dev__ } from '@powerfulyang/utils';

export const mysqlConfig = (): TypeOrmModuleOptions => {
  return {
    name: 'default',
    type: 'mysql',
    host: process.env.MYSQL_HOST || 'localhost',
    port: Number(process.env.MYSQL_PORT) || 3306,
    username: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || 'root',
    database: process.env.MYSQL_DATABASE || 'test',
    timezone: '+00:00',
    synchronize: __dev__ && true,
    logging: false,
    entities: [join(__dirname, '../**/**.entity{.ts,.js}')],
    migrations: [],
    subscribers: [],
  };
};

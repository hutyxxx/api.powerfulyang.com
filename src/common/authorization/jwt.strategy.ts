import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { User } from '@/entity/user.entity';
import { Request } from 'express';
import { AppLogger } from '@/common/logger/app.logger';
import { Authorization } from '@/constants/constants';
import { jwtSecretConfig } from '@/configuration/jwt.config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(private logger: AppLogger) {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                (request: Request) => {
                    return (
                        request?.cookies?.[Authorization] ||
                        request?.header(Authorization) ||
                        request?.query?.[Authorization]
                    );
                },
            ]),
            secretOrKey: jwtSecretConfig(),
        });
        this.logger.setContext(JwtStrategy.name);
    }

    validate(user: User) {
        // to check user status;
        this.logger.debug(`[user id is ${user.id}]-> query current!`);
        return user;
    }
}
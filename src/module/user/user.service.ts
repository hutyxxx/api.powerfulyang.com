import { Injectable } from '@nestjs/common';
import { User } from '@/entity/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { Profile } from 'passport-google-oauth20';
import { getStringVal } from '@/utils/getStringVal';
import { getRandomString, sha1 } from '@powerfulyang/node-utils';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User) private userDao: Repository<User>,
        private jwtService: JwtService,
    ) {}

    async googleUserRelation(profile: Profile) {
        const openid = profile.id;
        let user = await this.userDao.findOne({
            googleOpenId: openid,
        });
        if (!user) {
            user = new User();
            user.email = getStringVal(
                profile.emails?.find((email: any) => email.verified)
                    ?.value,
            );
            user.avatar = getStringVal(profile.photos?.pop()?.value);
            user.nickname = getStringVal(profile.displayName);
            user.googleOpenId = openid;
            this.generateDefaultPassword(user);
            user = await this.userDao.save(user);
        }
        return this.generateAuthorization(user);
    }

    generateAuthorization(userInfo: User) {
        return this.jwtService.sign({ ...userInfo });
    }

    generateDefaultPassword(draft: User) {
        draft.passwordSalt = getRandomString();
        draft.password = this.generatePassword(draft.passwordSalt);
    }

    generatePassword(
        salt: string,
        password: string = getRandomString(20),
    ) {
        return sha1(password, salt);
    }
}

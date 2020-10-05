import { Injectable } from '@nestjs/common';
import {
    IgApiClient,
    SavedFeedResponseMedia,
} from 'instagram-private-api';
import { join } from 'path';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { InstagramInterface } from 'api/instagram-bot/instagram.interface';

const Agent = require('socks5-https-client/lib/Agent');

@Injectable()
export class InstagramBotService {
    private readonly bot = new IgApiClient();

    private readonly cookiePath = join(
        process.cwd(),
        '.cookies',
        'instagram',
    );

    constructor() {
        this.bot.state.generateDevice(process.env.IG_USERNAME);
        const {
            BOT_SOCKS5_PROXY_HOST,
            BOT_SOCKS5_PROXY_PORT,
        } = process.env;
        if (BOT_SOCKS5_PROXY_HOST || BOT_SOCKS5_PROXY_PORT) {
            this.bot.request.defaults.agentClass = Agent;
            this.bot.request.defaults.agentOptions = <any>{
                socksHost: BOT_SOCKS5_PROXY_HOST,
                socksPort: Number(BOT_SOCKS5_PROXY_PORT),
            };
        }
        this.bot.request.end$.subscribe(async () => {
            const serialized = await this.bot.state.serialize();
            delete serialized.constants;
            writeFileSync(
                this.cookiePath,
                JSON.stringify(serialized),
            );
        });
    }

    private async checkLogin() {
        let shouldLogin = true;
        if (existsSync(this.cookiePath)) {
            try {
                const serialized = readFileSync(this.cookiePath);
                await this.bot.state.deserialize(
                    serialized.toString(),
                );
                await this.bot.user.info(this.bot.state.cookieUserId);
                shouldLogin = false;
            } catch (e) {
                shouldLogin = true;
            }
        }
        if (shouldLogin) {
            await this.bot.account.login(
                process.env.IG_USERNAME,
                process.env.IG_PASSWORD,
            );
        }
    }

    async fetchUndo(lastId?: string): Promise<InstagramInterface[]> {
        await this.checkLogin();
        const savedFeed = this.bot.feed.saved();
        const saved: InstagramInterface[] = [];
        let signal = true;
        do {
            const pageSaved = await savedFeed.items();
            for (let i = 0; i < pageSaved.length; i++) {
                if (pageSaved[i].id === lastId) {
                    signal = false;
                    break;
                }
                saved.push(
                    InstagramBotService.getDetailFromSavedMedia(
                        pageSaved[i],
                    ),
                );
            }
        } while (savedFeed.isMoreAvailable() && signal);
        return saved;
    }

    private static getTags(text?: string) {
        const tagsText = text
            ?.replace(/[\n\r]/, '')
            .match(/#[^#]*/gi);
        return (tagsText || []).map((x) => x.trim());
    }

    private static getDetailFromSavedMedia(
        savedItem: SavedFeedResponseMedia,
    ): InstagramInterface {
        return {
            id: savedItem.id,
            tags: InstagramBotService.getTags(
                savedItem.caption?.text,
            ),
            imgList: savedItem.carousel_media?.map(
                (x) => x.image_versions2.candidates[0].url,
            ) || [savedItem.image_versions2!.candidates[0].url],
        };
    }
}
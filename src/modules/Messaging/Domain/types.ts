export type DiscordConfig = {
    botToken : string,
    clientId : string,
    clientSecret : string,
    redirectUri : string
    redirectMsgTo? : string,
}

export type TelegramConfig = {
    botToken : string,
    redirectMsgTo? : string,
}
